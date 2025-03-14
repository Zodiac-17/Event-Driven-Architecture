"use client"
import React, { useState  ,useEffect} from 'react'
import { useSignUp } from '@clerk/nextjs'
import { useRouter} from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"

  import {Label} from "@/components/ui/label"
  import {Alert , AlertDescription} from "@/components/ui/alert"

  import { EyeOff ,Eye } from 'lucide-react'
  
 
 export default function Signup() {

    const { isLoaded , signUp ,setActive } = useSignUp()
    const [emailAddress , setEmailAddress] = useState("");
    const [password ,setPassword] = useState("");
    const [pendingVerification , setPendingVerfication ] = useState(false)
    const [code ,setcode] = useState("")
    const [error , setError] = useState("")
    const [showPassword , setShowPassword] = useState(false)

    const router = useRouter()

    if(!isLoaded){
        return null;
    }
    // useEffect(() => {
    //     if (isLoaded) {
    //       if (window.Clerk && window.Clerk.loadCaptcha) {
    //         window.Clerk.loadCaptcha();
    //       }
    //     }
    //   }, [isLoaded]);
      

  async function submit (e: React.FormEvent){
    e.preventDefault()
    if(!isLoaded){
        return;
    }
    try {
        await signUp.create({
            emailAddress,
            password
        })

        await signUp.prepareEmailAddressVerification({
            strategy:"email_code"
        });
        setPendingVerfication(true)

    } catch (error: any) {
        console.log(JSON.stringify(error,null, 2));
        setError(error.errors[0].message)
    }

  }

  async function onPressVerify(e:React.FormEvent) {
    e.preventDefault()
    if(!isLoaded){
        return
    }

    try{
      const completeSignUp =  await signUp.attemptEmailAddressVerification({code})

        if(completeSignUp.status !== "complete"){
            console.log(JSON.stringify(completeSignUp,null,2));
        }
        if (completeSignUp.status === "complete"){
            await setActive({session: completeSignUp.createdSessionId})
            router.push("/dashboard")
        }

    } catch(err: any){
    
        console.log(JSON.stringify(err,null,2));
        setError(err.errors[0].message)
    }
    
  }

   return (
    <div className='flex items-center justify-center min-h-screen bg-background bg-black'>
        <Card className='w-full max-w-md '>
            <CardHeader>
                <CardTitle className='text-2xl font-bold text-center'>
                    Sign Up for todo master
                </CardTitle>
            </CardHeader>
            <CardContent>
                {!pendingVerification ? ( 
                    <form onSubmit={ submit} className='space-y-4' >
                        <div className='space-y-2'>
                            <label htmlFor='email'>Email</label>
                            <Input
                            type ="email"
                            id ="email"
                            value={emailAddress}
                            onChange={(e) => setEmailAddress(e.target.value)}
                            />
                        </div>
                        <div className='space-y-2'>
                            <label htmlFor='password'>Password</label>
                            <div className='relative'>
                                <Input
                                type={showPassword ? "text" : "password"}
                                id ="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                />
                                <button
                                  type ="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className='absolute right-2 top-1/2 -translate-y-1/2'
                                >
                                   {showPassword ? (
                                    < EyeOff className='h-4 w-4 text-gray-500'/>
                                   ): (
                                    < Eye className='h-4 w-4 text-gray-500'/>
                                   )
                                   } 
                                </button>
                            </div>
                        </div>
                     {error && (
                        <Alert variant="destructive">
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                     )}
                     <div className=' flex justify-center'>
                     <button type='submit' className='w-auto bg-blue-500  border-blue-900 text-white hover:bg-blue-600 hover:border-blue-800  px-4 py-2'>
                        Sign Up
                     </button>
                     </div>
                     <div id="clerk-captcha"></div>
                    </form>
                    ):(

                        <form onSubmit={onPressVerify} className='space-y-4'>
                            <div className='space-y-2'>
                                <Label htmlFor='code'>Verification code</Label>
                                    <Input
                                     id = "code"
                                     value={code}
                                     onChange={(e) => setcode(e.target.value)}
                                     placeholder='Enter verification code'
                                     required
                                    />
                            </div>
                            {error && (
                                <Alert variant="destructive">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <Button type= "submit" className='w-full'>
                                Verify Email
                            </Button>
                        </form>
                      ) }
            </CardContent>
                <CardFooter className='justify-center'>
                    <p className='text-sm text-muted-foreground'>
                        Already have account ? {" "}
                        <Link
                        href= "/sign-in"
                        className='font-medium text-primary hover:underline'
                        >
                        Sign In
                        </Link>
                    </p>
                </CardFooter>
        </Card>
    </div>
   );            
}

