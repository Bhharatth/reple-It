import { rejects } from "assert";
import {S3} from "aws-sdk"
import { Budget } from "aws-sdk/clients/budgets";
import fs from "fs";
import { it } from "node:test";
import path, { resolve } from "path";
import { promiseHooks } from "v8";

const s3 = new S3({
    accessKeyId:"",
    secretAccessKey:"",
    endpoint:""
});


export async function fetchS3Folder (key:string, localPath: string):Promise<void>{

    const params = {
        Bucket: "vercel",
        Prefix: key
    }

    const response = await s3.listObjectsV2(params).promise();

    try {
        
        if(response.Contents){

            await Promise.all(response.Contents.map(async (file)=> {
                const fileKey = file.Key;
    
                if(fileKey){
                    const getObjectParams = {
                        Bucket: "",
                        Key: fileKey  //path to the object looking for
                    };
    
                    const data = await s3.getObject(getObjectParams).promise();
    
                if(data.Body){
                    const fileData = data.Body;
                    const filePath = `${localPath}/${fileKey.replace(key,"")}`;
    
                    await writeFile(filePath, fileData as Buffer);
                }
                }
            }))
        } 
    } catch (error) {
        console.error('Error fetching folder:', error);
    }

  

}


function writeFile(filePath:string, fileData: Buffer):Promise<void>{
    return new Promise(async (resolve, reject)=> {
        await createFolder(path.dirname(filePath));
        fs.writeFile(filePath, fileData, (err)=> {
            if(err){
                reject();
            }else{
                resolve()
            }
        })
    })
}

function createFolder(dirName: string){
    return new Promise<void>((resolve, reject)=> {
        fs.mkdir(dirName, {recursive: true}, (err)=> {
            if(err){
                return reject(err)
            }
            resolve()
        })
    })
};

export const saveToS3 = async  (key: string, filePath: string, content:string): Promise<void>=> {
    const params = {
        Bucket: "",
        Key:"",
        Body:""
    }

    await s3.putObject(params).promise();
}