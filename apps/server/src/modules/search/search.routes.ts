import { Router } from "express";
import { globalSearch } from "./search.controller";

const router = Router();

router.get("/", globalSearch);

export default router;
