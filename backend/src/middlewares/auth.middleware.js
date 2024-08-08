import jwt from "jsonwebtoken";
import config from "./../config";

export const auth = (req, res, next) => {
  try {
    const { token } = req.cookies;

    if (!token)
      return res
        .status(401)
        .json({ message: "No token, autorización denegada" });

    jwt.verify(token, config.token_secret, (error, user) => {
      if (error) {
        return res.status(401).json({ message: "Token no válido" });
      }
      req.user = user;
      next();
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};