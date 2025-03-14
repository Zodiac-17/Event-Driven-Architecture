import { Webhook } from "svix"
import { headers } from "next/headers"
import { WebhookEvent } from "@clerk/nextjs/server"
import prisma from "@/lib/prisma"
import { error } from "console";

export async function POST(req: Request){
    const Webhook_SECRET = process.env.WEBHOOK_SECRET;

    if(!Webhook_SECRET){
        throw new Error (
            "Please add webhook secret to your .env or env.local"
        );
    }

    const headerPayload = await headers();
    const svix_id =  headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp")
    const svix_signature = headerPayload.get("svix-signature")

    if(!svix_id || !svix_timestamp || !svix_signature){
        return new Response("Error occurred -- no svix headers",{
            status:400,
        });
    }

    const payload = await req.json();
    const body = JSON.stringify(payload);

    const wh = new Webhook(Webhook_SECRET);
    let evt: WebhookEvent;

    try {
        evt = wh.verify(body,{
            "svix-id": svix_id,
            "svix-signature":svix_signature,
            "svix-timestamp": svix_timestamp
        })as WebhookEvent;
    }catch(err) {
        console.error("Error verifying webhook:" ,err);
        return new Response("Error Occured",{
            status:400,
        });
    }

    const { id } = evt.data;
    const eventType = evt.type;

    console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
    console.log("Webhook body :",body);

    if (eventType === "user.created"){
        try{
            const {email_addresses, primary_email_address_id}=evt.data;
            console.log(evt.data);

            const primaryEmail = email_addresses.find(
                (email) => email.id === primary_email_address_id
            );

            console.log("Primary email", primaryEmail);
            console.log("email addresses",primaryEmail?.email_address)

            if(!primaryEmail){
                console.error("No primary email found");
                return new Response("No primary email found", {status:400});
            }

            const newUser = await prisma.user.create({
                data: {
                    id: evt.data.id!,
                    email: primaryEmail.email_address,
                    isSubscribed: false,
                }
            });
            console.log("New user created:", newUser)
        }catch(error){
            console.error("error created user in database:",error);
            return new Response("Error creating user", {status :500});
        }
    }

    return new Response("Webhook received succesfully ", {status:200});
    
}