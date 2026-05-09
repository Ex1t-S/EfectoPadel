import { useEffect, useState } from "react";
import { Alert, ScrollView, Text } from "react-native";
import { Button, Card, Muted, Screen, Title } from "@/components";
import { api } from "@/lib/api";
import { colors } from "@/theme";

interface Tournament {
  id: string;
  title: string;
  category: string;
  starts_at: string;
  status: string;
  description: string;
}

export default function Torneos() {
  const [items, setItems] = useState<Tournament[]>([]);

  async function load() {
    setItems(await api<Tournament[]>("/tournaments"));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function register(id: string) {
    try {
      await api(`/tournaments/${id}/register`, { method: "POST" });
      Alert.alert("Solicitud enviada", "El admin confirmara tu inscripcion.");
    } catch (error) {
      Alert.alert("No se pudo anotar", error instanceof Error ? error.message : "Intenta nuevamente");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Torneos</Title>
        <Muted>Solicita inscripcion. El admin confirma y genera grupos y llaves automaticamente.</Muted>
        {items.map((item) => (
          <Card key={item.id}>
            <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>{item.title}</Text>
            <Muted>
              {item.category} | {new Date(item.starts_at).toLocaleDateString("es-AR")} | {item.status}
            </Muted>
            <Muted>{item.description}</Muted>
            {item.status === "open" ? <Button title="Solicitar inscripcion" onPress={() => register(item.id)} /> : null}
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
