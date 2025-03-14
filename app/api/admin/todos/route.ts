import { NextRequest , NextResponse } from "next/server";
import {auth } from "@clerk/nextjs/server"
import { clerkClient } from "@clerk/clerk-sdk-node";
import prisma from "@/lib/prisma";



const ITEMS_PER_PAGE = 10;

async function isAdmin(userId: string){
    const user = await clerkClient.users.getUser(userId)
    return user.publicMetadata.role === "admin";
}

export async function GET(req: NextResponse){
    const {userId} = await auth();
    
    if(!userId){
        return NextResponse.json({error: "Unauthorized"},{status: 401});
    }
    if(!(await isAdmin(userId))){
        return NextResponse.json({error:"forbidden"}, {status: 403})
    }

    const { searchParams } = new URL(req.url)
    const email = searchParams.get("email");
    const page = parseInt(searchParams.get("page") || "1");

    try{
        const user = await prisma.user.findUnique({
            where: {email: email || ""},
            include:{
                todos:{
                    orderBy:{ createdAt:"desc" },
                    take: ITEMS_PER_PAGE,
                    skip:(page-1)*ITEMS_PER_PAGE,
                }
            }
        });

        if(!user){
            return NextResponse.json({user: null , totalPages: 0 ,currentPages:1});
        }

        const totoalTodos = await prisma.todo.count({
            where: {userId: user.id},
        })

        const totalPages = Math.ceil(totoalTodos /ITEMS_PER_PAGE);

        return NextResponse.json({
            user,
            totalPages,
            currentPage: page
        });
    } catch(error){
        return NextResponse.json({
            error: "internal server Error"
        },
         { status:500}
        );
    }
}

export async function PUT(req: NextRequest) {
    const {userId} = await auth();
    
    if(!userId){
        return NextResponse.json({error: "Unauthorized"},{status: 401});
    }
    if(!(await isAdmin(userId))){
        return NextResponse.json({error:"forbidden"}, {status: 403})
    }

    try{
        const {email, todoId,todoCompleted ,isSubscribed} = await req.json()

        if(todoId !== undefined && todoCompleted !== undefined){
            // update todo
            const updateTodo = await prisma.todo.update({
                where: {id : todoId},
                data: {completed: todoCompleted},
            });
            return NextResponse.json(updateTodo)
        }
        else if(isSubscribed !== undefined){
            //update user subscription

            const updateUser = await prisma.user.update({
                where: {email},
                data: {
                    isSubscribed,
                    subscriptionEnds: isSubscribed ? new Date(Date.now() + 30*24*60*60*1000)
                    : null,
                },
            });
            return NextResponse.json(updateUser);
        }else{
            return NextResponse.json({error: "Invalid Request"},{status:400})
        }
    } catch(error){
        return NextResponse.json(
            {error: "internal server error"},
            {status: 500}
        );
    }
}

export async function DELETE (req : NextRequest) {
    const {userId} = await auth()

    if(!userId){
        return NextResponse.json({error: "Unauthorized"},{status: 401});
    }
    if(!(await isAdmin(userId))){
        return NextResponse.json({error:"forbidden"}, {status: 403})
    }
    try {
        const { todoId } = await req.json()
        await prisma.todo.delete({
            where:{id: todoId}
        });

        return NextResponse.json({ message: "Todo deleted successfully"})
        
    } catch (error) {
        return NextResponse.json(
            {error: "Internal Server Error"},
            {status: 500}
        );
    }
  
}