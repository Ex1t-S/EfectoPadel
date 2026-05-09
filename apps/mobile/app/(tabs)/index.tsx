import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Card, Muted, Screen, Title } from "@/components";
import { api } from "@/lib/api";
import { colors } from "@/theme";

export default function Home() {
  const [dashboard, setDashboard] = useState({ nextReservations: 0, openTournaments: 0 });

  useEffect(() => {
    Promise.all([api<any[]>("/reservations/mine"), api<any[]>("/tournaments")])
      .then(([reservations, tournaments]) => {
        setDashboard({
          nextReservations: reservations.filter((item) => item.status === "confirmed").length,
          openTournaments: tournaments.filter((item) => item.status === "open").length
        });
      })
      .catch(() => undefined);
  }, []);

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 18, paddingBottom: 40 }}>
        <View>
          <Title>Club activo</Title>
          <Muted>Reserva, desafia y subi en tu categoria.</Muted>
        </View>
        <Card>
          <Text style={{ color: colors.green, fontSize: 42, fontWeight: "900" }}>{dashboard.nextReservations}</Text>
          <Muted>Reservas confirmadas proximas</Muted>
        </Card>
        <Card>
          <Text style={{ color: colors.amber, fontSize: 42, fontWeight: "900" }}>{dashboard.openTournaments}</Text>
          <Muted>Torneos abiertos para inscripcion</Muted>
        </Card>
        <Card>
          <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>Efecto Padel</Text>
          <Muted>Las reservas quedan firmes solo cuando Mercado Pago confirma la sena.</Muted>
        </Card>
      </ScrollView>
    </Screen>
  );
}
