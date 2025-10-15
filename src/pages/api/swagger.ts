import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import YAML from "yaml";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (process.env.NODE_ENV === "production") {
    res.status(404).end("Not found");
    return;
  }

  const file = fs.readFileSync("src/swagger/swagger.yaml", "utf8");
  const swaggerDocument = YAML.parse(file);

  res.status(200).json(swaggerDocument);
}
