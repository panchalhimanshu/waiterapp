import React, { useState, useEffect, useRef } from "react";
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Modal, useWindowDimensions, ScrollView, GestureResponderEvent, RefreshControl } from "react-native";
import { IconSymbol } from "@/components/ui/IconSymbol";
import CallFor from "../../utilities/CallFor";
import { CustomizationDrawer } from '@/components/CustomizationDrawer';
import { CommonHeader } from '@/components/CommonHeader';
import { router } from "expo-router";
import { LoadingSpinner } from '@/components/LoadingSpinner';
import GlobalPropperties from "@/utilities/GlobalPropperties";
import { FlatListRefresh } from '@/components/ScrollRefresh';

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
  const [loading, setLoading] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

      // Get the route params
      const params = router.params as { bookingId?: string; tableId?: string; uid?: string };


  const getNumColumns = () => {
    if (width < 600) return 2;        // Mobile screens
    if (width < 960) return 3;        // Tablet screens
    return 4;                         // Larger screens
  };

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  const fetchMenuItems = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  const handleTouchStart = (event: GestureResponderEvent) => {
    setTouchStart(event.nativeEvent.pageX);
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    const touchEnd = event.nativeEvent.pageX;
    const minSwipeDistance = 20; // minimum distance for swipe

    // Calculate swipe distance
    const swipeDistance = touchStart - touchEnd;

    // Find current category index
    const currentIndex = categories.findIndex(cat => cat.id == selectedCategory.id);

    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0 && currentIndex < categories.length - 1) {
        // Swiped Left - Next Category
        setSelectedCategory(categories[currentIndex + 1]);
      } else if (swipeDistance < 0 && currentIndex > 0) {
        // Swiped Right - Previous Category
        setSelectedCategory(categories[currentIndex - 1]);
      }
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMenuItems();
    setRefreshing(false);
  };

  const renderGridItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.gridCard, { width: width / getNumColumns() - 16 }]}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.gridImageContainer}>
        <Image 
          source={{ uri: `${GlobalPropperties.viewdocument}${item.image}` }}
          style={styles.gridImage}
          resizeMode="cover"
        />
        <View style={styles.gridOverlay}>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => handleItemPress(item)}
          >
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.gridItemDetails}>
        <Text style={styles.gridItemName} numberOfLines={1}>{item.name}</Text>
        <View style={styles.gridRatingPriceContainer}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderListItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={styles.listCard}
      onPress={() => handleItemPress(item)}
    >
      <View style={styles.listImageContainer}>
        <Image 
          source={{ uri: `${GlobalPropperties.viewdocument}${item.image}` }}
          style={styles.listImage}
          resizeMode="cover"
        />
      </View>
      <View style={styles.listContent}>
        <Text style={styles.listItemName} numberOfLines={2}>{item.name}</Text>
        <View style={styles.listDetails}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
          <Text style={styles.price}>₹{item.price}</Text>
          <TouchableOpacity 
            style={styles.listAddButton}
            onPress={() => handleItemPress(item)}
          >
            <Text style={styles.addText}>+ Add</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

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
              <Text style={selectedCategory.id == category.id ? styles.activeTab : styles.inactiveTab}>
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Toggle View Button */}
      <TouchableOpacity 
        style={styles.toggleButton}
        onPress={() => setIsGridView(!isGridView)}
      >
        <IconSymbol 
          name={isGridView ? "menu" : "dashboard"} 
          size={24} 
          color="#fff"
        />
      </TouchableOpacity>

      {/* Menu Items with Swipe Handlers */}
      <View 
        style={styles.menuItemsContainer}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <FlatListRefresh
          data={menuItems}
          keyExtractor={(item) => item.id.toString()}
          numColumns={isGridView ? getNumColumns() : 1}
          key={isGridView ? 'grid' : 'list'}
          renderItem={isGridView ? renderGridItem : renderListItem}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>

      {/* Customization Drawer */}
      {selectedItem && (
        <CustomizationDrawer
          isVisible={isModalVisible}
          item={selectedItem}
          onClose={handleCloseDrawer}
        />
      )}

      {loading && <LoadingSpinner />}
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
  toggleButton: {
    position: 'absolute',
    right: 16,
    bottom: 30,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  listCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    margin: 8,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    padding:8,
    overflow: 'hidden',
  },
  listImageContainer: {
    width: '40%', // 40% of the card width for image
  },
  listImage: {
    width: '100%',
    height: 100,
    borderRadius: 8,
  },
  listContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'space-between',
  },
  listItemName: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 8,
  },
  listDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  addText: {
    color: "white",
    fontSize: 14,
    fontWeight: '600',
  },
  listAddButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  gridCard: {
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  gridImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120, // Increased height for better image display
  },
  gridImage: {
    width: '100%',
    height: '100%',
    
  },
  gridOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    // backgroundColor: 'rgba(0,0,0,0.2)',
  },
  gridItemDetails: {
    padding: 12,
  },
  gridItemName: {
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
  },
  gridRatingPriceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  menuItemsContainer: {
    flex: 1,
    width: '100%',
  },
});

export default MenuScreen;
