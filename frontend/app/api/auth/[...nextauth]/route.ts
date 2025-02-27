import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
declare module "next-auth" {
  interface Profile  {
    given_name: string;
    family_name: string;
    picture: string;
    email?: string;
  }
  interface Session {
    user: {
      id: number;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (token.userId && session.user) {
        session.user.id = token.userId as number;
      }
      if (token) {
        
        session.accessToken = token.accessToken as string;
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        if (account.access_token) {
          token.accessToken = account.access_token;
          token.accessToken = account.access_token;
          token.refreshToken = account.refresh_token; 
          token.accessTokenExpires = Date.now() 
        } else {
          console.error("No access token found in the account object.");
        }
    
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/custom-user/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id_token: account.id_token,
            email: profile.email,
            first_name: profile.given_name || "",
            last_name: profile.family_name || "",
            profile_picture: profile.picture || "",
          }),
        });
        const textResponse = await response.text(); 
      
        if (!response.ok) {
          
          console.error(textResponse);
        }
        if (response.ok) {
          
          const userData = JSON.parse(textResponse);
          token.userId = userData.user.id;
          token.accessToken = userData.access_token;
          token.refreshToken = userData.refresh_token; 
          token.accessTokenExpires = Date.now() +  60 * 60 * 50; 
          
        }
      }
    
      return token;
    }
  },
});

export { handler as GET, handler as POST };
