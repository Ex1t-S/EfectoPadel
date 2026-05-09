import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { Button, Card, Muted, Screen, Title } from "@/components";
import { api } from "@/lib/api";
import { colors } from "@/theme";

interface Slot {
  court_id: string;
  court_name: string;
  starts_at: string;
  ends_at: string;
  price_cents: number;
  deposit_cents: number;
}

export default function Reservas() {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function load() {
    const today = new Date().toISOString().slice(0, 10);
    const data = await api<Slot[]>(`/slots?date=${today}`);
    setSlots(data);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function reserve(slot: Slot) {
    const key = `${slot.court_id}-${slot.starts_at}`;
    setLoadingId(key);
    try {
      const data = await api<{ checkoutUrl: string }>("/payments/booking-preference", {
        method: "POST",
        body: JSON.stringify({
          courtId: slot.court_id,
          startsAt: slot.starts_at,
          endsAt: slot.ends_at
        })
      });
      await WebBrowser.openBrowserAsync(data.checkoutUrl);
      await load();
    } catch (error) {
      Alert.alert("No se pudo reservar", error instanceof Error ? error.message : "Intenta nuevamente");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Reservas</Title>
        <Muted>Elegi un turno disponible. Se bloquea unos minutos mientras pagas la sena.</Muted>
        {slots.map((slot) => {
          const key = `${slot.court_id}-${slot.starts_at}`;
          return (
            <Card key={key}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <View>
                  <Text style={{ color: colors.text, fontSize: 20, fontWeight: "900" }}>{slot.court_name}</Text>
                  <Muted>
                    {new Date(slot.starts_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })} -{" "}
                    {new Date(slot.ends_at).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </Muted>
                </View>
                <Text style={{ color: colors.green, fontWeight: "900" }}>${slot.deposit_cents / 100}</Text>
              </View>
              <Button title="Reservar y pagar sena" loading={loadingId === key} onPress={() => reserve(slot)} />
            </Card>
          );
        })}
        {slots.length === 0 ? <Muted>No hay turnos disponibles para hoy.</Muted> : null}
      </ScrollView>
    </Screen>
  );
}
