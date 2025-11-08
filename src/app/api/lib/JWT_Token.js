import jwt from "jsonwebtoken";

 export const generateToken = (user) => {
  console.log(process.env.JWT_EXPIRES_IN)
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "15m",
    }
  );

  const refreshToken = jwt.sign(
    {
      id: user._id,
    },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn:process.env.JWT_REFRESH_EXPIRES_IN || "7d",
    }
  );
  return { accessToken, refreshToken };
};
