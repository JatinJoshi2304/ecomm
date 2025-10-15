import type { NextApiRequest, NextApiResponse } from "next";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import YAML from "yaml";

// Load Swagger YAML
const file = fs.readFileSync("src/swagger/swagger.yaml", "utf8");
const swaggerDocument = YAML.parse(file);

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only serve Swagger in development
  // if (process.env.NODE_ENV === "production") {
  //   res.status(404).end("Not found");
  //   return;
  // }

  // @ts-expect-error: djnvdjkvvdfjk vdjvbn b
  return swaggerUi.serve(req, res, () => {
    // @ts-expect-error: lwkndk sdc c o
    swaggerUi.setup(swaggerDocument)(req as any, res as any);
  });
}
