// If the backend server is setup to assume this is legit, there's no need to implement a real auth solution
// Add this to the request via some sort of metadata so the rest of the backend can utilise it as `req.user` and `req.firm`
// Each request will also need to send of a `X-Firm-Id` header that is a uuid that MUST be found in the below array. if it's not send back a 401

type JWTMetadata = {
  uuid: string; // <-- UUID of the user (this is the users Cimplico Id across apps)
  workpapers: {
    firms: [
      {
        id: string; // <-- UUID of the firm the user belongs to
        shortId: string; // <-- 8 character unique short code (use this in the front ends url to identify the current firm)
      }
    ];
  };
};

// This will be a user returned from the Workpapers API
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

type Region =
  | 'australia'
  | 'newZealand'
  | 'unitedKingdom'
  | 'republicOfIreland'
  | string;

type Tag = string;

type WorkpaperType = 'compliance' | 'itr' | 'bas' | 'taxPlanning' | 'fbt';

type EntityType = 'company' | 'individual' | 'partnership' | 'trust' | string;

type BaseContent = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  createdBy: User;
  publishedAt: Date;
  publishedBy: User;
  region: Region[];
  name: string;
  description: string;
  tags: Tag[];
  workpaperType?: WorkpaperType[]; // No options means its available for any type
  entityType?: EntityType[]; // No options means its available for any type
};

type CalculationContent = BaseContent & { type: 'calculation' };
type ChecklistContent = BaseContent & { type: 'checklist' };
type ProcedureContent = BaseContent & { type: 'procedure' };
type ReportContent = BaseContent & { type: 'report' };
type OtherSchedulesContent = BaseContent & { type: 'otherSchedules' };
type Content =
  | CalculationContent
  | ChecklistContent
  | ProcedureContent
  | ReportContent
  | OtherSchedulesContent;

/**
 * Example of a workpapers api sdk that will mock requests and responses. Use something like this inside the backend application.
 */

class WorkpapersAPI {
  // Example of the "API" request to get all content for a given firm
  getContent(firmId: string, filters?: unknown): Promise<Content[]> {
    // Resolve a promise after 500ms to return a list of 5 content with a uuid
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve([]); // <-- Fake content goes here with applied filters
        /**
         * {
         * totalItems: number;
         * data: Content[]
         * }
         */
      }, 500); // Delay 500ms to simulate a network call
    });
  }
  // Example of the "API" request to subscribe a firm to a piece of content
  subscribeToContent(
    firmId: string,
    subscriberId: string,
    contentId: string
  ): Promise<void> {
    // Send req to api to subscribe to content
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(); // <-- Fake response goes here
        /**
         * {
         * result: 'success' | 'error
         * error?: string
         * }
         */
      }, 500); // Delay 500ms to simulate a network call
    });
  }
}
