import {Express} from "express";
import express from "express";
import { copyS3Folder } from "./aws";

export function initHttp(app: Express){
    app.use(express.json());

    app.post("/project", async (req, res)=> {

        const {repleId, language}= req.body;

        if(!repleId){
            res.status(500).send("Bad request");
            return;
        }

        await copyS3Folder(`base/${language}`, `code/${repleId}`);

        res.send("Project created");
    });
}