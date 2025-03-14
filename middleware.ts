import { clerkMiddleware, createRouteMatcher   } from '@clerk/nextjs/server'
 import { clerkClient } from '@clerk/clerk-sdk-node';
 import { NextResponse , NextRequest } from 'next/server'

const publicRoute = createRouteMatcher([
    "/",
    "/home",
    "/api/webhook/register",
    "/sign-in",
    "/sign-up"
]);

export default clerkMiddleware(async (auth, req) =>{
    const {userId} = await auth();
    //check if user is not Authorizedand  tryig to access protected routes 
    
    
    if(!userId && !publicRoute(req)){
        return NextResponse.redirect(new URL("/sign-in" ,req.url))
    }

    if(userId){

        try{
            const user = await clerkClient.users.getUser(userId)
            const role =user.publicMetadata.role as string | undefined ;
        
           // admin role redirect logic 
           if( role ==="admin" && req.nextUrl.pathname === "/dashboard"){
            return NextResponse.redirect(new URL("/admin/dashboard",req.url));
           }

           // Prevent non-admin users from accesig admin route

           if( role !== "admin" && req.nextUrl.pathname.startsWith("/admin")){
            return NextResponse.redirect(new URL("/dashboard", req.url));
           }


           //redirect authenticated users trying to access public routes
           if(publicRoute(req)){
            return NextResponse.redirect(new URL(role === "admin" ?"/admin/dashboard" : "/dashboard" ,req.url))
           }

           }catch(error){
            console.error("Error fetching user data from clerk",error);
            return NextResponse.redirect(new URL("/error", req.url))
           }
    }
    return NextResponse.next();

})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

