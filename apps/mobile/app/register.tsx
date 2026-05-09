import { router } from "expo-router";
import { useState } from "react";
import { Alert, ScrollView, View } from "react-native";
import { PADEL_CATEGORIES, type PadelCategory } from "@efecto/shared";
import { Button, Card, Field, Muted, Screen, Title } from "@/components";
import { api } from "@/lib/api";
import { setToken } from "@/lib/auth";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<PadelCategory>("5ta");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const data = await api<{ token: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, password, firstName, lastName, phone, category })
      });
      await setToken(data.token);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("No pudimos crear la cuenta", error instanceof Error ? error.message : "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 40 }}>
        <View>
          <Title>Crear cuenta</Title>
          <Muted>Completa tus datos para jugar, reservar y competir.</Muted>
        </View>
        <Card>
          <Field placeholder="Nombre" value={firstName} onChangeText={setFirstName} />
          <Field placeholder="Apellido" value={lastName} onChangeText={setLastName} />
          <Field placeholder="Telefono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Field placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Field placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PADEL_CATEGORIES.map((item) => (
              <Button
                key={item}
                title={item}
                tone={category === item ? "primary" : "secondary"}
                onPress={() => setCategory(item)}
              />
            ))}
          </ScrollView>
          <Button title="Registrarme" onPress={submit} loading={loading} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
