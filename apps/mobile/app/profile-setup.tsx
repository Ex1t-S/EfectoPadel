import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView } from "react-native";
import { PADEL_CATEGORIES, type PadelCategory } from "@efecto/shared";
import { api } from "@/lib/api";
import { Button, Card, Field, Muted, Screen, Title } from "@/components";

export default function ProfileSetup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<PadelCategory>("5ta");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<any>("/me").then((profile) => {
      setFirstName(profile?.first_name ?? "");
      setLastName(profile?.last_name ?? "");
      setPhone(profile?.phone ?? "");
      setCategory(profile?.category ?? "5ta");
    }).catch(() => undefined);
  }, []);

  async function save() {
    setLoading(true);
    try {
      await api("/me", {
        method: "PUT",
        body: JSON.stringify({ firstName, lastName, phone, category })
      });
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Perfil incompleto", error instanceof Error ? error.message : "Revisa los datos");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18 }}>
        <Title>Tu perfil</Title>
        <Muted>Estos datos se usan para reservas, ranking y torneos.</Muted>
        <Card>
          <Field placeholder="Nombre" value={firstName} onChangeText={setFirstName} />
          <Field placeholder="Apellido" value={lastName} onChangeText={setLastName} />
          <Field placeholder="Telefono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {PADEL_CATEGORIES.map((item) => (
              <Button key={item} title={item} tone={category === item ? "primary" : "secondary"} onPress={() => setCategory(item)} />
            ))}
          </ScrollView>
          <Button title="Guardar y entrar" onPress={save} loading={loading} />
        </Card>
      </ScrollView>
    </Screen>
  );
}
