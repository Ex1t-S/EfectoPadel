import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Button, Card, Muted, Screen, Title } from "@/components";
import { api } from "@/lib/api";
import { clearToken } from "@/lib/auth";
import { colors } from "@/theme";

export default function Perfil() {
  const [profile, setProfile] = useState<any>(null);
  const [reservations, setReservations] = useState<any[]>([]);

  useEffect(() => {
    api("/me").then(setProfile).catch(() => undefined);
    api<any[]>("/reservations/mine").then(setReservations).catch(() => undefined);
  }, []);

  async function logout() {
    await clearToken();
    router.replace("/login");
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Perfil</Title>
        <Card>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: "900" }}>
            {profile?.first_name} {profile?.last_name}
          </Text>
          <Muted>{profile?.phone}</Muted>
          <Muted>
            Categoria {profile?.category} | {profile?.elo} ELO
          </Muted>
          <Button title="Editar datos" tone="secondary" onPress={() => router.push("/profile-setup")} />
          <Button title="Cerrar sesion" tone="secondary" onPress={logout} />
        </Card>
        <Title>Mis reservas</Title>
        {reservations.map((item) => (
          <Card key={item.id}>
            <Text style={{ color: colors.text, fontWeight: "900" }}>{item.courts?.name ?? "Cancha"}</Text>
            <Muted>{new Date(item.starts_at).toLocaleString("es-AR")}</Muted>
            <Muted>Estado: {item.status}</Muted>
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
