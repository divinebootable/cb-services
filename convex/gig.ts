import { title } from 'process';
import { v } from "convex/values"

import { internalMutation, mutation, query } from "./_generated/server"
import { Id } from "./_generated/dataModel"


export const create = mutation({
      args: {
        title: v.string(),
        description: v.string(),
        subcategoryId: v.string(),
      },
      handler: async (ctx, args) =>{
          const identity = await ctx.auth.getUserIdentity();
          if (!identity){
            throw new Error("Unauthorized")
          }

          const user = await ctx.db
             .query("users")
             .withIndex("by_token", (q)=>
                    q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

            if(user === null){
              return;
            }

            const gigId = await ctx.db.insert("gigs", {
                title: args.title,
                description: args.description,
                subcategoryId: args.subcategoryId as Id<"subcategories">,
                sellerId: user._id!,
                published: false,
                clicks: 0,
            })

          return gigId;
      },
});

export const get = query({
  args: {id: v.id("gigs")},
  handler: async (ctx, args)=>{
       const gig = await ctx.db.get(args.id);
       if(gig === null){
        throw new Error("Gig not found");
       }
       const seller = await ctx.db.get(gig.sellerId as Id<"users">);

       if(!seller){
        throw new Error("Seller not found")
       }

       const country = await ctx.db.query("countries")
          .withIndex("by_userId", (q) => q.eq("userId", seller._id))
          .unique();

      if(country === null){
        throw new Error("Cpuntry not found");
      }
      // Get languages
      const languages = await ctx.db.query("languages")
         .withIndex("by_userId", (q)=> q.eq("userId", seller._id))
         .collect();
      const sellerWithCountryAndLanguages ={
        ...seller,
        country: country,
        languages: languages
      }

      const gigwithSeller = {
        ...gig,
        seller: sellerWithCountryAndLanguages
      };

      // get last fulfillment

      const lastFulfillment = await ctx.db.query("orders")
        .withIndex("by_gigId", (q) => q.eq("gigId", gig._id))
        .order("desc")
        .first();
      
      const gigWithSellerAndLastFulfillment ={
        ...gigwithSeller,
        lastFulfillment: lastFulfillment,
      };

      // get images
      const images = await ctx.db.query("gigMedia")
             .withIndex("by_gigId", (q)=>q.eq("gigId", gig._id))
             .collect();
      
      const imagesWithUrls = await Promise.all(images.map(async(image)=>{ const imageUrl = await ctx.storage.getUrl(image.storageId)
        if(!imageUrl){
          throw new Error("Image not found");
        }
        return {
          ...image, url: imageUrl
        };

      }));
     
     const gigWithSellerAndLastFulfillmentAndImages ={
           ...gigWithSellerAndLastFulfillment,
           images: imagesWithUrls,
     };

     return gigWithSellerAndLastFulfillmentAndImages;
    }
})