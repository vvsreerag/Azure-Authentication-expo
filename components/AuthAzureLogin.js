import * as React from "react";
import * as WebBrowser from "expo-web-browser";
import {
  exchangeCodeAsync,
  makeRedirectUri,
  useAuthRequest,
  useAutoDiscovery,
} from "expo-auth-session";
import { Button, Text, SafeAreaView, Image } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const AuthAzureLogin = () => {
  const discovery = useAutoDiscovery(
    "https://login.microsoftonline.com/fb4d31be-53ae-416d-970f-175afba126f2/v2.0"
  );
  const redirectUri = makeRedirectUri({
    native: "com.sreeragvv.loginazureapp://auth",
  });
  const clientId = "13b3ea0b-3eda-47c8-b445-fa78a5ac5882";

  // We store the JWT in here
  const [token, setToken] = React.useState(null);
  const [userInformation, setUserInformation] = React.useState([]);

  // Request
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId,
      scopes: ["openid", "profile", "email", "offline_access"],
      redirectUri,
    },
    discovery
  );

  const getUserInfo = async (token) => {
    if (!token) return;

    try {
      const response = await fetch(
        `https://graph.microsoft.com/oidc/userinfo`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const responseJson = await response.json();
      setUserInformation(responseJson);
      console.log(responseJson);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  return (
    <SafeAreaView>
      {userInformation && (
        <>
          {userInformation?.picture && (
            <Image
              source={{ uri: userInformation?.picture }}
              style={{ width: 100, height: 100, borderRadius: 50 }}
            />
          )}
          <Text>
            Name: {userInformation.given_name} {userInformation.family_name}
          </Text>
        </>
      )}
      <Button
        disabled={!request}
        title="Login in with Microsoft"
        onPress={() => {
          promptAsync().then((codeResponse) => {
            if (request && codeResponse?.type === "success" && discovery) {
              exchangeCodeAsync(
                {
                  clientId,
                  code: codeResponse.params.code,
                  extraParams: request.codeVerifier
                    ? { code_verifier: request.codeVerifier }
                    : undefined,
                  redirectUri,
                },
                discovery
              ).then(async (res) => {
                console.log(res);
                setToken(res.accessToken);
                await getUserInfo(res.accessToken);
              });
            }
          });
        }}
      />
      <Button
        title="Remove authentication"
        onPress={() => setUserInformation([])}
      />
    </SafeAreaView>
  );
};

export default AuthAzureLogin;
