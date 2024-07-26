"use client"

import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { useApiMutation } from "@/hooks/use-api-mutation";
import { useAuth } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import Link from "next/link"
import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation"

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { undefined } from "zod";
import { toast } from "sonner";

interface EditPageProps {
    params:{
        gigId: string;
    }
}

const Edit = ({ params }: EditPageProps)=>{
      const gig = useQuery(api.gig.get,{id: params.gigId as Id<"gigs"> })
      const published = useQuery(api.gig.isPublished, {id: params.gigId as Id<"gigs">});
      const {
        mutate: remove,
        pending: removePending,

      } =useApiMutation(api.gig.remove);
      const {
        mutate: publish,
        pending: publishPending

      }= useApiMutation(api.gig.publish);
      const {
        mutate: unpublish,
        pending: unpublishPending,
      }= useApiMutation(api.gig.unpublish);
      const router = useRouter();

      const identity = useAuth();

      const generateUploadUrl = useMutation(api.gigMedia.generateUploadUrl);

      const imageInput = useRef<HTMLInputElement>(null);
      const [selectedImages, setSelectedImages] = useState<File[]>([]);
      const sendImage = useMutation(api.gigMedia.sendImage);

       if (!identity){
           throw new Error("Unauthorized");
       }

       // undefined means it's still retrieving
       if(gig === undefined || published === undefined){
          return null;
       }

       if( gig === null){
        return <div>Not foound</div>;
       }

       async function handleImageUpload(event:FormEvent) {
             event.preventDefault();
             if(gig === undefined) return ;

             const nonNullableGig = gig as Doc<"gigs">;

             // Step 1: get a short-lived upload URL
             const postUrl = await generateUploadUrl();

             await Promise.all(selectedImages.map(async (image)=>{
                  const result = await fetch(postUrl, {
                       method: "POST",
                       headers: {"Content-Type": image.type},
                       body: image

                  });

                  const json = await result.json();

                  if (!result.ok){
                    throw new Error(`Upload failed: ${JSON.stringify(json)}`);
                  }
                  const { storageId } = json
                  //step 2: Save the newlt allocated storage id to th database
                  await sendImage({storageId, format: "image", gigId:nonNullableGig._id})
                  .catch((error)=>{
                      console.log(error);
                      toast.error("Maximu 5 files reached.");
                  });
             }));
             setSelectedImages([]);
             imageInput.current!.value = "";
        
       }
}

export default Edit