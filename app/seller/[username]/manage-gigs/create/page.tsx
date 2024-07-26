"use client"

import { useEffect } from "react"
import { CreateForm } from "../../../[username]/manage-gigs/create/_components/create-form";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface CreateGigProps {
    params: {
        username: string;
    }
}

const CreateGig = ({
    params
}: CreateGigProps) =>{
    const insertSubcategories = useMutation(api.seedSubcategories.create);
    useEffect(()=>{
        insertSubcategories({});
    })
    return (
        <div className="flex justify-center">
           <CreateForm username={params.username} />
        </div>
    )
}

export default CreateGig