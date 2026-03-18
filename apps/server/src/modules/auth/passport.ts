import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { prisma } from "../../config/database";

import { Strategy as DiscordStrategy } from "passport-discord";
import { Strategy as FacebookStrategy } from "passport-facebook";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID || "dummy",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "dummy",
      callbackURL: "/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email found from Google"), undefined);

        let user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              username: profile.displayName.replace(/\s+/g, "").toLowerCase() + Math.floor(Math.random() * 1000),
              password: "", 
              emailVerified: true,
              profile: {
                create: {
                  displayName: profile.displayName,
                  avatarUrl: profile.photos?.[0].value,
                },
              },
            },
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID || "dummy",
      clientSecret: process.env.DISCORD_CLIENT_SECRET || "dummy",
      callbackURL: "/api/v1/auth/discord/callback",
      scope: ["identify", "email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.email;
        if (!email) return done(new Error("No email found from Discord"), undefined);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              username: profile.username + Math.floor(Math.random() * 1000),
              password: "",
              emailVerified: true,
              profile: {
                create: {
                  displayName: profile.global_name || profile.username,
                  avatarUrl: profile.avatar ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png` : null,
                },
              },
            },
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID || "dummy",
      clientSecret: process.env.FACEBOOK_APP_SECRET || "dummy",
      callbackURL: "/api/v1/auth/facebook/callback",
      profileFields: ["id", "emails", "name", "photos"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0].value;
        if (!email) return done(new Error("No email found from Facebook"), undefined);

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
          user = await prisma.user.create({
            data: {
              email,
              username: (profile.name?.givenName || "fbuser") + Math.floor(Math.random() * 1000),
              password: "",
              emailVerified: true,
              profile: {
                create: {
                  displayName: `${profile.name?.givenName} ${profile.name?.familyName}`,
                  avatarUrl: profile.photos?.[0].value,
                },
              },
            },
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
