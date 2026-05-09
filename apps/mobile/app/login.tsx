import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Text, View } from "react-native";
import { Button, Card, Field, Muted, Screen, Title } from "@/components";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";
import { colors } from "@/theme";

WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const googleClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;

  async function signIn() {
    setLoading(true);
    try {
      const data = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      await setToken(data.token);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("No pudimos ingresar", error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View style={{ flex: 1, justifyContent: "center", gap: 20 }}>
        <View>
          <Title>Efecto Padel</Title>
          <Muted>Reserva canchas, compite por ranking y anotate a torneos.</Muted>
        </View>
        <Card>
          <Field placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
          <Field placeholder="Password" secureTextEntry value={password} onChangeText={setPassword} />
          <Button title="Iniciar sesion" onPress={signIn} loading={loading} />
          {googleClientId ? (
            <GoogleButton clientId={googleClientId} />
          ) : (
            <Button
              title="Google no configurado"
              tone="secondary"
              onPress={() => Alert.alert("Google OAuth", "Falta configurar EXPO_PUBLIC_GOOGLE_CLIENT_ID en apps/mobile/.env")}
            />
          )}
          <Link href="/register" asChild>
            <Text style={{ color: colors.green, textAlign: "center", fontWeight: "800" }}>Crear cuenta nueva</Text>
          </Link>
        </Card>
      </View>
    </Screen>
  );
}

function GoogleButton({ clientId }: { clientId: string }) {
  const [, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId,
    webClientId: clientId
  });

  useEffect(() => {
    const idToken = response?.type === "success" ? response.params.id_token : null;
    if (!idToken) return;
    api<{ token: string }>("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken })
    })
      .then(async (data) => {
        await setToken(data.token);
        router.replace("/(tabs)");
      })
      .catch((error) => Alert.alert("Google OAuth", error.message));
  }, [response]);

  return <Button title="Continuar con Google" tone="secondary" onPress={() => promptAsync()} />;
}
