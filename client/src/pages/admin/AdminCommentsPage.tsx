import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CommentStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import AdminLayout from "@/components/layout/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Search, Check, X, AlertTriangle } from "lucide-react";

interface Comment {
  id: number;
  userId: number;
  listingId: number;
  content: string;
  rating: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  listing?: {
    id: number;
    title: string;
    price: number;
    images?: string[];
  };
}

const AdminCommentsPage = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewStatus, setReviewStatus] = useState<string>(CommentStatus.APPROVED);
  const [reviewReason, setReviewReason] = useState("");

  // 获取待审核评论
  const { data: pendingComments = [], isLoading, refetch } = useQuery<Comment[]>({
    queryKey: ["/api/admin/comments/pending"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/admin/comments/pending");
      return response || [];
    },
  });

  // 审核评论的mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, reason }: { id: number; status: string; reason?: string }) => {
      return await apiRequest("PATCH", `/api/admin/comments/${id}`, { status, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments/pending"] });
      setReviewDialogOpen(false);
      setSelectedComment(null);
      setReviewReason("");
      
      toast({
        title: t("admin.commentReviewed"),
        description: reviewStatus === CommentStatus.APPROVED 
          ? t("admin.commentApproved") 
          : t("admin.commentRejected"),
      });
      
      refetch();
    },
    onError: (error) => {
      toast({
        title: t("admin.reviewError"),
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // 处理评论审核
  const handleReviewComment = (comment: Comment) => {
    setSelectedComment(comment);
    setReviewStatus(CommentStatus.APPROVED); // 默认设置为批准
    setReviewDialogOpen(true);
  };

  // 提交评论审核
  const submitReview = () => {
    if (!selectedComment) return;
    
    // 如果是拒绝评论，需要提供原因
    if (reviewStatus === CommentStatus.REJECTED && !reviewReason.trim()) {
      toast({
        title: t("admin.reasonRequired"),
        description: t("admin.pleaseProvideReason"),
        variant: "destructive",
      });
      return;
    }
    
    reviewMutation.mutate({
      id: selectedComment.id,
      status: reviewStatus,
      reason: reviewStatus === CommentStatus.REJECTED ? reviewReason : undefined,
    });
  };

  // 过滤评论
  const filteredComments = pendingComments.filter(comment => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      (comment.user?.firstName?.toLowerCase().includes(query) || false) ||
      (comment.user?.lastName?.toLowerCase().includes(query) || false) ||
      (comment.user?.email?.toLowerCase().includes(query) || false) ||
      (comment.listing?.title?.toLowerCase().includes(query) || false) ||
      comment.content.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout>
      <Card>
        <CardHeader>
          <CardTitle>{t("admin.commentManagement")}</CardTitle>
          <CardDescription>
            {t("admin.reviewAndManageComments")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder={t("admin.searchComments")}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery
                ? t("admin.noCommentsFound")
                : t("admin.noCommentsToReview")}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.user")}</TableHead>
                  <TableHead>{t("admin.product")}</TableHead>
                  <TableHead>{t("admin.rating")}</TableHead>
                  <TableHead>{t("admin.comment")}</TableHead>
                  <TableHead>{t("admin.date")}</TableHead>
                  <TableHead>{t("admin.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredComments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.user?.avatar} />
                          <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                            {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {comment.user?.firstName} {comment.user?.lastName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {comment.user?.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {comment.listing?.images && comment.listing.images.length > 0 ? (
                          <img
                            src={comment.listing.images[0]}
                            alt={comment.listing.title}
                            className="h-8 w-8 object-cover rounded"
                          />
                        ) : (
                          <div className="h-8 w-8 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                            No img
                          </div>
                        )}
                        <div className="font-medium truncate max-w-[150px]">
                          {comment.listing?.title}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < comment.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300"
                            }`}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate" title={comment.content}>
                        {comment.content}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReviewComment(comment)}
                      >
                        {t("admin.review")}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 评论审核对话框 */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t("admin.reviewComment")}</DialogTitle>
            <DialogDescription>
              {t("admin.reviewCommentDescription")}
            </DialogDescription>
          </DialogHeader>

          {selectedComment && (
            <div className="py-4">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={selectedComment.user?.avatar} />
                    <AvatarFallback className="bg-primary-100 text-primary-700 text-xs">
                      {selectedComment.user?.firstName?.[0]}{selectedComment.user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {selectedComment.user?.firstName} {selectedComment.user?.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedComment.user?.email}
                    </div>
                  </div>
                </div>

                <div className="mb-2">
                  <div className="text-sm font-medium">{t("admin.product")}:</div>
                  <div className="text-sm">{selectedComment.listing?.title}</div>
                </div>

                <div className="mb-2">
                  <div className="text-sm font-medium">{t("admin.rating")}:</div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < selectedComment.rating
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm font-medium">{t("admin.comment")}:</div>
                  <div className="text-sm mt-1 p-3 bg-gray-50 rounded-md">
                    {selectedComment.content}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="text-sm font-medium block mb-2">
                    {t("admin.reviewDecision")}:
                  </label>
                  <Select
                    value={reviewStatus}
                    onValueChange={setReviewStatus}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={CommentStatus.APPROVED}>
                        <div className="flex items-center">
                          <Check className="mr-2 h-4 w-4 text-green-500" />
                          {t("admin.approve")}
                        </div>
                      </SelectItem>
                      <SelectItem value={CommentStatus.REJECTED}>
                        <div className="flex items-center">
                          <X className="mr-2 h-4 w-4 text-red-500" />
                          {t("admin.reject")}
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {reviewStatus === CommentStatus.REJECTED && (
                  <div>
                    <label className="text-sm font-medium block mb-2">
                      {t("admin.rejectionReason")}:
                    </label>
                    <Textarea
                      value={reviewReason}
                      onChange={(e) => setReviewReason(e.target.value)}
                      placeholder={t("admin.rejectionReasonPlaceholder")}
                      rows={3}
                    />
                    {!reviewReason.trim() && (
                      <div className="flex items-center text-amber-600 text-sm mt-2">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        {t("admin.reasonRequired")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setReviewDialogOpen(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              variant={reviewStatus === CommentStatus.APPROVED ? "default" : "destructive"}
            >
              {reviewMutation.isPending
                ? t("common.processing")
                : reviewStatus === CommentStatus.APPROVED
                ? t("admin.approve")
                : t("admin.reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminCommentsPage;
