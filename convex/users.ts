import { mutation } from "./_generated/server";

export const store = mutation({
    args: {},
    handler: async (ctx) =>{
        const identity = await ctx.auth.getUserIdentity();
        if(!identity){
            throw new Error(" Called registeredUser without authentication present")
        }

        // check if we've already registere this identity before
        const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
        .unique();

        if (user !== null){
            // if we've seen this identity before but the name has changed, path the value.
            if(user.username !== identity.nickname){
                await ctx.db.patch(user._id, { username: identity.nickname})
            }
            return user._id;
        }
        // if we've never seen this identity before, create a new user
        const userId = await ctx.db.insert("users", {
            fullName: identity.name!,
            tokenIdentifier: identity.tokenIdentifier,
            title:"",
            about:"",
            username: identity.nickname!,
            profileImageUrl: identity.profileUrl,
        });
        return userId;

    }
})