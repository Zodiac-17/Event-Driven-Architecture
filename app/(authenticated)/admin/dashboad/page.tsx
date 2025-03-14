"use client"

import { useToast } from "@/hooks/use-toast";
import { useCallback,useEffect,useState } from "react";
import { Card ,CardHeader,CardTitle,CardContent } from "@/components/ui/card";
import { TodoItem } from "@/components/TodoItem";
import { Todo , User } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/Pagination";
import {useDebounceCallback, useDebounceValue} from "usehooks-ts"
import { CACHE_ONE_YEAR } from "next/dist/lib/constants";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";

interface UserwithTodos extends User {
    todos: Todo[];
}

export default function AdminDashboard(){

    const { toast } = useToast();
    const [email , setEmail] = useState("");
    const [debounceEmail , setDebounceEmail] = useDebounceValue("",300);
    const [user , setUser] = useState<UserwithTodos | null>(null)
    const [isLoading , setIsLoading] = useState(false);
    const [currentPage,setCurrentPage] = useState(1);
    const [totalPages,setTotalPages] = useState(1);

    const fetchUserData = useCallback(
        async (page: number) => {
            setIsLoading(true);
            try{
                const response =await fetch(
                    `/api/admin?email=${debounceEmail}&page=${page}`
                );
                if(!response.ok) throw new Error("Failed to fetch user data");

                const data = await response.json();
                setUser(data.user);
                setTotalPages(data.totalPages);
                setCurrentPage(data.currentPage);
                toast({
                    title: "Success",
                    description: "User data fetched succesfully."
                });
            }catch(error){
                toast({
                    title: "Error",
                    description: "Failed to fetch user data. Please try again",
                    variant: "destructive",
                });
                
                }finally{
                    setIsLoading(false);
            }
        },[debounceEmail,toast]
    );

    useEffect(() =>{
        if(debounceEmail){
            fetchUserData(1);
        }
    },[debounceEmail,fetchUserData]);

    const handleSearch = (e: React.FormEvent) =>{
        e.preventDefault();
        setDebounceEmail(email);
    };

    const handleUpdateSubscription = async () => {
        toast({
            title: "Upading subscription",
            description: "Please wait...",
        });
        try{
            const response = await fetch("/api/admin",{
                method : "PUT",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    email: debounceEmail,
                    isSubscribed: !user?.isSubscribed,
                }),
            });
            if(!response.ok) throw new Error("Failed to update subscription");
            fetchUserData(currentPage);
            toast({
                title:"Success",
                description: "Subscripption updated successfully."
            });
        }catch(error){
            toast({
                title: "Error",
                description: "Failed to update subscription. please try again",
                variant:"destructive",
            })
        }
    }

    const handleUpdateTodo = async (id: string, completed:boolean) =>{
        toast({
            title: "Updating Todo",
            description:"Please wait..", 
        });

        try {
            const response = await fetch("/api/admin",{
                method: "PUT",
                headers: {"Content-type":"application/json"},
                body: JSON.stringify({
                    email:debounceEmail,
                    todoId: id,
                    todoCompleted: completed,
                })
            });

            if(!response.ok) throw new Error("Failed to update todo");
            fetchUserData(currentPage);
            toast({ title: "Success",
                description: "Todo updated succesfully."
            });
        }catch(error){
            toast({
                title: "Error",
                description: "Failed to update todo. Please try again",
                variant:"destructive",
            });
        }
    };

    const handleDeleteTodo = async ( todoId: string) =>{
        toast ({
            title: "Deleting todo",
            description: "Please wait"
        })

        try {
            //make delete request to api
            const response = await fetch("/api/admin",{
                method: "DELETE",
                headers: {"Content-Type":"application/json"},
                body : JSON.stringify({email: debounceEmail,todoId}),
            });
            //if request uncucessful throw erroe
            if(!response.ok){
                throw new Error("Failed to delete")
            }
            //refersh user data after delete
            fetchUserData(currentPage);

            toast({
                title:"Successfully deleted",
                description:"TODO deleted successfully"
            });

        } catch (error) {
            toast({
                title: "Error",
                description:"Failed to delte todo , please try again",
                variant: "destructive"
            })
            
        }
    }

    return(
        <div className="conatiner mx-auto p-4 max-w-3xl mb-8">
            <h1 className="text-3xl font-bold mb-8 text-center">AdminDashboard</h1>
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Search User</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="flex space-x-2">
                        <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter user Email"
                        required
                        />
                        <Button type="submit"> Search </Button>
                    </form>
                </CardContent>
            </Card>

            {isLoading ? (
                <Card>
                    <CardContent className=" text-center py-8">
                        <p className="text-muted-foreground">Loading the User.....</p>
                    </CardContent>
                </Card>
            ) : user ?(
                <>
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>User Details</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>Email:{user.email}</p>
                            <p>
                                Subscription Status: {" "}
                                {user.isSubscribed ? "Subscribed" : "Not Subscribed"}

                            </p>
                            {user.subscriptionEnds && (
                                <p>
                                    Subscription Ends:{" "}
                                    {new Date(user.subscriptionEnds).toLocaleDateString()}
                                </p>
                            )}
                            <Button onClick={handleUpdateSubscription} className="mt-2">
                                {user.isSubscribed ? "Cancel Subscription" : "Subscribe User"}
                            </Button>
                        </CardContent>
                    </Card>

                    {user.todos.length > 0 ? (
                        <Card>
                            <CardHeader>
                                <CardTitle> User Todos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul>
                                    {user.todos.map((todo) =>(
                                        <TodoItem
                                        key={todo.id}
                                        todo={todo}
                                        isAdmin={true}
                                        onUpdate={handleUpdateTodo}
                                        onDelete={handleDeleteTodo}
                                        />
                                     ))}
                                </ul>
                                <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => fetchUserData(page)}
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        <Card>
                            <CardContent className="text-center py-8">
                                <p className=" text-muted-foreground">This user has no todos.</p>
                            </CardContent>
                        </Card>
                    )}
                </>
            ): debounceEmail ?(
               <Card>
                <CardContent className=" text-center py-8">
                    <p className="text-muted-foreground">No user found with this Email</p>
                </CardContent>
               </Card> 
            ) : null }

        </div>
    );
}