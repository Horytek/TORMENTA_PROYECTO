import config from "./../config";
import jwt from "jsonwebtoken";

export async function createAccessToken(payload) {
  return new Promise((resolve, reject) => {
    jwt.sign(payload, 
        config.token_secret, 
        { expiresIn: "1d" }, 
        (err, token) => {
            if (err) reject(err);
            resolve(token);
        });
  });
}