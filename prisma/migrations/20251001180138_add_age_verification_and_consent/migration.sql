-- AlterTable
ALTER TABLE "public"."UserProfile" ADD COLUMN     "ageVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ageVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "consentMarketingAt" TIMESTAMP(3),
ADD COLUMN     "consentPrivacyPolicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentPrivacyPolicyAt" TIMESTAMP(3),
ADD COLUMN     "consentTermsOfService" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "consentTermsOfServiceAt" TIMESTAMP(3);
