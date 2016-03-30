import Base from './index';
import AskSocialNetworkOrLogin from './field/or/ask_social_network_or_login';
import SignUp from './classic/sign_up_screen';
import ResetPassword from './database/reset_password';
import { renderSSOScreens } from './lock/sso/index';
import { getScreen, initDatabase } from './database/index';
import { initEnterprise, isInCorpNetwork } from './connection/enterprise';
import { initSocial } from './social/index';
import { setEmail } from './field/email';
import { setUsername } from './field/username';
import * as l from './lock/index';
import KerberosScreen from './connection/enterprise/kerberos_screen';

export default class Auth0Lock extends Base {

  static SCREENS = {
    login: AskSocialNetworkOrLogin,
    forgotPassword: ResetPassword,
    signUp: SignUp
  };

  constructor(...args) {
    super("classic", dict, ...args);
  }

  didInitialize(model, options) {
    model = initSocial(model, options);
    model = initDatabase(model, options);
    model = initEnterprise(model, options);

    const { email, username } = options.prefill || {};
    if (typeof email === "string") model = setEmail(model, email);
    if (typeof username === "string") model = setUsername(model, username);

    this.setModel(model);
  }

  didReceiveClientSettings(m) {
    const anyDBConnection = l.getEnabledConnections(m, "database").count() > 0;
    const anySocialConnection = l.getEnabledConnections(m, "social").count() > 0;
    const anyEnterpriseConnection = l.getEnabledConnections(m, "enterprise").count() > 0;

    if (!anyDBConnection && !anySocialConnection && !anyEnterpriseConnection) {
      // TODO: improve message
      throw new Error("At least one database, enterprise or social connection needs to be available.");
    }
  }

  render(m) {
    const ssoScreen = renderSSOScreens(m);
    if (ssoScreen) return ssoScreen;

    if (isInCorpNetwork(m) && !m.getIn(["sso", "skipped"], false)) {
      return new KerberosScreen();
    }

    const Screen = Auth0Lock.SCREENS[getScreen(m)];
    if (Screen) return new Screen();

    throw new Error("unknown screen");
  }

}

const dict = {
  forgotPassword: {
    emailInputPlaceholder: "yours@example.com",
    footerText: "",
    headerText: "Please enter your email and the new password. We will send you an email to confirm the password change.",
    usernameInputPlaceholder: "your username"
  },
  kerberos: {
    headerText: "You are connected from your corporate network&hellip;",
    skipLastLoginLabel: "Not your account?"
  },

  lastLogin: {
    headerText: "Last time you logged in with",
    skipLastLoginLabel: "Not your account?"
  },
  login: {
    emailInputPlaceholder: "yours@example.com",
    footerText: "",
    forgotPasswordLabel: "Don't remember your password?",
    headerText: "",
    loginTabLabel: "Login",
    loginWith: "Login with {idp}",
    passwordInputPlaceholder: "your password",
    separatorText: "or",
    signUpTabLabel: "Sign Up",
    smallSocialButtonsHeader: "Login with",
    ssoEnabled: "Single Sign-on enabled",
    usernameInputPlaceholder: "your username"
  },
  signUp: {
    emailInputPlaceholder: "yours@example.com",
    footerText: "",
    headerText: "",
    loginTabLabel: "Login",
    passwordInputPlaceholder: "your password",
    separatorText: "or",
    signUpTabLabel: "Sign Up",
    signUpWith: "Sign up with {idp}",
    usernameInputPlaceholder: "your username",
  },
  signedIn: {
    success: "Thanks for signing in."
  },
  signedUp: {
    success: "Thanks for signing up."
  }
};
