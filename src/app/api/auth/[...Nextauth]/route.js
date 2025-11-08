import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { connectDB } from "../../db/db";
import User from "../../models/userModel";
import { NextResponse } from "next/server";

const handler=NextAuth({
    providers:[
        GoogleProvider({
            clientId:process.env.GOOGLE_CLIENT_ID,
            clientSecret:process.env.GOOGLE_CLIENT_SECRET,
        }),
        GitHubProvider({
            clientId:process.env.GITHUB_CLIENT_ID,
            clientSecret:process.env.GITHUB_CLIENT_SECRET,
        }),

    ],
    callbacks:{
        async signIn({user}){
            await connectDB();

            try{
                const existingUser=await User.findOne({email:user.email})

                if(existingUser){
                    return NextResponse.json({message:"User already exists"}, {status:200})
                }else{
                  const newUser=  await User.create({
                    firstName : user.name.split(" ")[0],
                    lastName : user.name.split(" ")[1] || "",
                    email : user.email,
                    password:"oauth"
                  })
                }
            }catch(error){
                console.log("Error checking/creating user:", error);
                throw error;
            }
            return true;
        },
        async session({session,token}){
            session.user.id=token.sub;
            return session;
        },
    },
    secret:process.env.NEXTAUTH_SECRET,
});

export {handler as GET,handler as POST}