import { Schema, Types } from "mongoose";
import { tenantContext } from "../utils/tenantContext";

export function tenantPlugin(schema: Schema) {
  // Only apply to schemas that have a municipalityId
  const hasMunicipalityId = schema.path("municipalityId");
  if (!hasMunicipalityId) return;

  const methods = [
    "find",
    "findOne",
    "findOneAndDelete",
    "findOneAndReplace",
    "findOneAndUpdate",
    "countDocuments",
    "updateMany",
    "updateOne",
  ];

  methods.forEach((method) => {
    schema.pre(method as any, function (this: any, next) {
      const store = tenantContext.getStore();
      
      if (store && store.municipalityId && !store.bypassTenant) {
        // Inject municipalityId filter
        this.where({ municipalityId: store.municipalityId });
      }
      
      next();
    });
  });

  // Handle aggregates
  schema.pre("aggregate", function (this: any, next) {
    const store = tenantContext.getStore();
    
    if (store && store.municipalityId && !store.bypassTenant) {
      // Unshift a $match stage to filter by municipalityId
      this.pipeline().unshift({
        $match: { municipalityId: new Types.ObjectId(store.municipalityId) },
      });
    }
    
    next();
  });
}
