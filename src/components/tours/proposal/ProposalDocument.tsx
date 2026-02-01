/* eslint-disable jsx-a11y/alt-text */
"use client";

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";

// Register fonts (Optional: Load a nice font from Google Fonts)
Font.register({
  family: "Helvetica",
  fonts: [
    {
      src: "https://fonts.gstatic.com/s/helveticaneue/v1/HelveticaNeue-Regular.ttf",
    },
    {
      src: "https://fonts.gstatic.com/s/helveticaneue/v1/HelveticaNeue-Bold.ttf",
      fontWeight: "bold",
    },
  ],
});

// Styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Helvetica", fontSize: 10, color: "#333" },

  // Header / Cover
  coverPage: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#1a1a1a",
  },
  subtitle: { fontSize: 14, color: "#666", marginBottom: 30 },
  coverImage: {
    width: 500,
    height: 300,
    objectFit: "cover",
    borderRadius: 8,
    marginBottom: 30,
  },

  // Section
  section: {
    marginBottom: 20,
    paddingBottom: 10,
    borderBottom: "1 solid #eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#2563EB",
  }, // Primary Blue

  // Grid for stats
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    backgroundColor: "#F3F4F6",
    padding: 15,
    borderRadius: 4,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 14, fontWeight: "bold" },
  statLabel: { fontSize: 8, color: "#666", textTransform: "uppercase" },

  // Itinerary
  dayContainer: { flexDirection: "row", marginBottom: 15 },
  dayMarker: { width: 40, alignItems: "center", marginRight: 15 },
  dayCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2563EB",
    color: "#fff",
    fontSize: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dayContent: { flex: 1 },
  dayTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  dayDate: { fontSize: 8, color: "#888", marginBottom: 6 },
  itemRow: { flexDirection: "row", marginBottom: 4, alignItems: "center" },
  itemType: {
    fontSize: 7,
    backgroundColor: "#eee",
    padding: "2 4",
    borderRadius: 2,
    marginRight: 5,
    textTransform: "uppercase",
  },

  // Price
  priceBox: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "#1a1a1a",
    color: "white",
    textAlign: "center",
    borderRadius: 8,
  },
  priceLabel: {
    fontSize: 12,
    textTransform: "uppercase",
    marginBottom: 5,
    color: "#aaa",
  },
  priceValue: { fontSize: 24, fontWeight: "bold" },
});

// Helper to format currency
const formatPrice = (amount: any) => Number(amount || 0).toLocaleString();

export function ProposalDocument({ tour }: { tour: any }) {
  return (
    <Document>
      {/* PAGE 1: COVER */}
      <Page size="A4" style={styles.page}>
        <View style={styles.coverPage}>
          {/* Placeholder Logo */}
          <Text style={{ marginBottom: 20, fontSize: 10, color: "#888" }}>
            JOURN-AI TRAVELS
          </Text>

          <Text style={styles.title}>{tour.name}</Text>
          <Text style={styles.subtitle}>
            {tour.duration} Days • {tour.startLocation} to {tour.destination}
          </Text>

          {/* If you have a cover image for the tour, use it here. Using a placeholder for now. */}
          <Image
            src="https://placehold.co/600x400/png"
            style={styles.coverImage}
          />

          <View style={{ marginTop: 20, alignItems: "center" }}>
            <Text>Prepared for:</Text>
            <Text style={{ fontSize: 14, fontWeight: "bold", marginTop: 5 }}>
              {tour.client?.name || "Valued Client"}
            </Text>
            <Text style={{ color: "#666", marginTop: 2 }}>
              {new Date().toDateString()}
            </Text>
          </View>
        </View>
      </Page>

      {/* PAGE 2: DETAILS & ITINERARY */}
      <Page size="A4" style={styles.page}>
        {/* Trip Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {new Date(tour.startDate).toDateString()}
            </Text>
            <Text style={styles.statLabel}>Start Date</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{tour.duration} Days</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {tour.participantSummary?.totalPax || 0} Pax
            </Text>
            <Text style={styles.statLabel}>Travelers</Text>
          </View>
        </View>

        {/* Detailed Itinerary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Itinerary</Text>

          {tour.itinerary.map((day: any) => (
            <View key={day.id} style={styles.dayContainer}>
              <View style={styles.dayMarker}>
                <View style={styles.dayCircle}>
                  <Text>{day.dayNumber}</Text>
                </View>
              </View>
              <View style={styles.dayContent}>
                <Text style={styles.dayTitle}>{day.title}</Text>
                <Text style={styles.dayDate}>
                  {new Date(day.date).toDateString()}
                </Text>

                {day.items.map((item: any) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemType}>{item.type}</Text>
                    <Text>{item.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Pricing */}
        <View style={styles.priceBox}>
          <Text style={styles.priceLabel}>Total Package Price</Text>
          <Text style={styles.priceValue}>
            NPR {formatPrice(tour.financials?.sellingPrice)}
          </Text>
          <Text style={{ fontSize: 8, marginTop: 5, color: "#666" }}>
            Inclusive of all taxes and service charges
          </Text>
        </View>

        {/* Footer */}
        <Text
          style={{
            position: "absolute",
            bottom: 30,
            left: 40,
            right: 40,
            fontSize: 8,
            textAlign: "center",
            color: "#aaa",
          }}
        >
          Generated by JournAI • Contact: support@journai.com
        </Text>
      </Page>
    </Document>
  );
}
