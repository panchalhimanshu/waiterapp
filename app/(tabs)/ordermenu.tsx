import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Modal, useWindowDimensions, ScrollView } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import CallFor from "../../utilities/CallFor";
import { CustomizationDrawer } from '@/components/CustomizationDrawer';
import { CommonHeader } from '@/components/CommonHeader';
import { router } from "expo-router";

const categories = [
  { name: "Best Seller", id: 0 },
  { name: "Appetizer", id: 1 },
  { name: "Pizza", id: 29 },
  { name: "Burger", id: 30 },
  { name: "Beverage", id: 13 },
];

const MenuScreen = () => {
  const { width } = useWindowDimensions();
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const [menuItems, setMenuItems] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

      // Get the route params
      const params = router.params as { bookingId?: string; tableId?: string; uid?: string };

      console.log(params,"params")

  const getNumColumns = () => {
    if (width < 600) return 2;        // Mobile screens
    if (width < 960) return 3;        // Tablet screens
    return 4;                         // Larger screens
  };

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  const fetchMenuItems = async () => {
    try {
      const response = await CallFor(
        "products/filter",
        "post",
        {
          proname: null,
          proconfig: 14,
          catid: selectedCategory.id,
          page: 1,
          limit: 1000,
        },
        "Auth"
      );

      if (response?.data?.data) {
        const transformedItems = response.data.data.map((item: any) => ({
          id: item.proid,
          name: item.proname,
          price: item.hasvarient 
            ? item.variants?.[0]?.pvsalesprice 
            : item.variant?.pvsalesprice || "0",
          rating: "4.5",
          image: item.product_image_url,
          hasvarient: item.hasvarient,
          variants: item.variants,
          variant: item.variant,
          description: item.prodescription
        }));

        setMenuItems(transformedItems);
      }
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const handleItemPress = (item: any) => {
    if (!item) return;
    setSelectedItem(item);
    setIsModalVisible(true);
  };

  const handleCloseDrawer = () => {
    setIsModalVisible(false);
    setSelectedItem(null);
  };

  return (
    <View style={styles.container}>
      <CommonHeader title="Menu" />

      {/* Category Tabs */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
      >
        <View style={styles.tabs}>
          {categories.map((category) => (
            <TouchableOpacity 
              key={category.id}
              onPress={() => setSelectedCategory(category)}
              style={styles.tabButton}
            >
              <Text style={selectedCategory.id === category.id ? styles.activeTab : styles.inactiveTab}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Menu Items */}
      <FlatList
        data={menuItems}
        keyExtractor={(item :any) => item.id.toString()}
        numColumns={getNumColumns()}
        key={getNumColumns()}  // Force re-render when columns change
        renderItem={({ item }: { item: any }) => (
          <TouchableOpacity 
            style={[styles.card, { width: width / getNumColumns() - 16 }]}
            onPress={() => handleItemPress(item)}
          >
            <Image 
              source={{ uri: `http://172.16.1.57:5004${item.image}` }}
              style={styles.image}
            />
              <TouchableOpacity 
              style={styles.addButton}
              onPress={() => handleItemPress(item )}
            >
              <Text style={styles.addText}>+ Add</Text>
            </TouchableOpacity>
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.name}</Text>
              <View style={styles.ratingPriceContainer}>
                <Text style={styles.rating}>⭐ {item.rating}</Text>
                <Text style={styles.price}>₹{item.price}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Customization Drawer */}
      {selectedItem && (
        <CustomizationDrawer
          isVisible={isModalVisible}
          item={selectedItem}
          onClose={handleCloseDrawer}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 0 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#4CAF50", padding: 15 , paddingTop: 30},
  tableTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  tabsContainer: {
    flexGrow: 0,
    marginVertical: 15,
  },
  tabs: { 
    flexDirection: "row",
    paddingHorizontal: 15,
  },
  tabButton: {
    marginRight: 20,
  },
  activeTab: { 
    fontWeight: "bold", 
    color: "black", 
    borderBottomWidth: 2, 
    borderBottomColor: "black",
    paddingBottom: 5,
  },
  inactiveTab: { 
    color: "gray",
    paddingBottom: 5,
  },
  card: { 
    margin: 8,
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: { 
    width: "100%", 
    height: 120, 
    borderRadius: 10,
    marginBottom: 8 
  },
  addButton: { position: "absolute", top: 5, left: 5, backgroundColor: "#222", padding: 5, borderRadius: 5 },
  addText: { color: "white", fontSize: 12 },
  itemDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  itemName: {
    fontWeight: "bold",
    fontSize: 14,
    flex: 1, // This allows the name to take available space
  },
  ratingPriceContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8, // Space between rating and price
  },
  rating: {
    color: "#4CAF50",
    fontSize: 12,
  },
  price: {
    fontSize: 14,
    fontWeight: "bold",
  },
  customizable: { color: "red", fontSize: 10, fontWeight: "bold" },
  description: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
});

export default MenuScreen;
