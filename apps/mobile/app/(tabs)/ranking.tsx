import { useEffect, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { PADEL_CATEGORIES, type PadelCategory } from "@efecto/shared";
import { Button, Card, Muted, Screen, Title } from "@/components";
import { api } from "@/lib/api";
import { colors } from "@/theme";

interface Player {
  id: string;
  first_name: string;
  last_name: string;
  category: PadelCategory;
  elo: number;
}

export default function Ranking() {
  const [category, setCategory] = useState<PadelCategory>("5ta");
  const [players, setPlayers] = useState<Player[]>([]);

  async function load(nextCategory = category) {
    setPlayers(await api<Player[]>(`/leaderboard?category=${nextCategory}`));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, [category]);

  async function challenge(player: Player) {
    try {
      await api("/challenges", {
        method: "POST",
        body: JSON.stringify({ opponentId: player.id, category })
      });
      Alert.alert("Desafio enviado", `${player.first_name} recibira la solicitud.`);
    } catch (error) {
      Alert.alert("No se pudo desafiar", error instanceof Error ? error.message : "Intenta nuevamente");
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
        <Title>Ranking</Title>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {PADEL_CATEGORIES.map((item) => (
            <Button key={item} title={item} tone={category === item ? "primary" : "secondary"} onPress={() => setCategory(item)} />
          ))}
        </ScrollView>
        {players.map((player, index) => (
          <Card key={player.id}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <Text style={{ color: colors.green, fontSize: 24, fontWeight: "900", width: 36 }}>#{index + 1}</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 18, fontWeight: "900" }}>
                  {player.first_name} {player.last_name}
                </Text>
                <Muted>{player.elo} ELO</Muted>
              </View>
            </View>
            <Button title="Desafiar" tone="secondary" onPress={() => challenge(player)} />
          </Card>
        ))}
      </ScrollView>
    </Screen>
  );
}
