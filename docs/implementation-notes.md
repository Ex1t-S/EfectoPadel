# Implementation Notes

- Toda la base de datos vive en Neon PostgreSQL.
- La API gestiona auth propia con JWT, bcrypt para password y validacion de Google ID token.
- Mobile y admin guardan el JWT y lo mandan como bearer token a la API.
- `available_slots` es una vista SQL basada en horarios configurados y reservas activas.
- Los holds vencidos vuelven a aparecer automaticamente porque la vista ignora holds expirados.
- El ranking usa ELO por categoria y se actualiza cuando se confirma el resultado de un desafio.
- La generacion de torneo crea fase de grupos y placeholders de eliminacion directa.
- La primera cancelacion de reservas pagadas es manual desde admin; reembolsos se gestionan fuera o se agrega endpoint especifico.
