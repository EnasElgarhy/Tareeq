import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { SignInScreen } from "@/components/marketing/SignInScreen";

export default function SignInPage() {
  return (
    <LocaleProvider>
      <SignInScreen />
    </LocaleProvider>
  );
}
