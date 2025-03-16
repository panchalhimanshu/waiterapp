import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Modal } from 'react-native';
import { useCart } from '@/context/CartContext';

interface CustomizationDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  item: any;
}

export const CustomizationDrawer = ({ isVisible, item, onClose }: CustomizationDrawerProps) => {
  const [selectedVariant, setSelectedVariant] = useState<string | null>(
    item?.hasvarient ? item.variants[0]?.pvid : null
  );
  const [selectedAttributes, setSelectedAttributes] = useState<{[key: string]: string}>({});
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  React.useEffect(() => {
    if (item?.hasvarient && item?.variants[0]?.pvamappings) {
      const initialAttributes: {[key: string]: string} = {};
      item.variants[0].pvamappings.forEach((attr: any) => {
        if (attr.isrequired && attr.pvamvaluemodels?.[0]) {
          initialAttributes[attr.attributeid] = attr.pvamvaluemodels[0].avid;
        }
      });
      setSelectedAttributes(initialAttributes);
    }
  }, [item]);

  React.useEffect(() => {
    if (item) {
      setSelectedVariant(item?.hasvarient ? item.variants[0]?.pvid : null);
    }
  }, [item]);

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{item?.name}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderVariants = () => {
    if (item?.hasvarient && item?.variants?.length > 0) {
      const firstVariant = item.variants[0];
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Size</Text>
          <Text style={styles.required}>Required • Select any 1 option</Text>
          {item.variants.map((variant: any) => (
            <TouchableOpacity 
              key={variant.pvid}
              style={[
                styles.optionItem,
                selectedVariant == variant.pvid && styles.selectedOption
              ]}
              onPress={() => setSelectedVariant(variant.pvid)}
            >
              <View style={styles.optionLeft}>
                <Text style={styles.optionName}>{variant.pvname}</Text>
              </View>
              <View style={styles.optionRight}>
                <Text style={styles.price}>₹{variant.pvsalesprice}</Text>
                <View style={[
                  styles.radioButton,
                  selectedVariant == variant.pvid && styles.radioButtonSelected
                ]} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return null;
  };

  const renderAttributes = () => {
    const mappings = item?.hasvarient 
      ? (selectedVariant 
          ? item.variants.find((v: any) => v.pvid == selectedVariant)?.pvamappings 
          : item.variants[0]?.pvamappings)
      : item?.variant?.pvamappings;

    if (!mappings) return null;

    return mappings.map((attribute: any) => (
      <View key={attribute.pvamid} style={styles.section}>
        <Text style={styles.sectionTitle}>{attribute.attributeName}</Text>
        {attribute.isrequired && (
          <Text style={styles.required}>Required • Select any 1 option</Text>
        )}
        {attribute.pvamvaluemodels.map((value: any) => (
          <TouchableOpacity 
            key={value.avid}
            style={[
              styles.optionItem,
              selectedAttributes[attribute.attributeid] == value.avid && styles.selectedOption
            ]}
            onPress={() => setSelectedAttributes(prev => ({
              ...prev,
              [attribute.attributeid]: value.avid
            }))}
          >
            <View style={styles.optionLeft}>
              <Text style={styles.optionName}>{value.attributeValueName}</Text>
            </View>
            <View style={styles.optionRight}>
              <View style={[
                styles.radioButton,
                selectedAttributes[attribute.attributeid] == value.avid && styles.radioButtonSelected
              ]} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    ));
  };

  const handleQuantityChange = (change: number) => {
    const newQuantity = quantity + change;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (!item) return;

    const selectedVariantDetails = item.hasvarient 
      ? item.variants?.find((v: any) => v.pvid == selectedVariant)
      : item.variant;

    if (!selectedVariantDetails) return;

    const cartItem = {
      id: selectedVariantDetails.pvid,
      productId: item.id,
      name: item.name,
      image: item.image,
      quantity: quantity,
      price: selectedVariantDetails.pvsalesprice,
      variant: selectedVariantDetails.pvname,
      variantId: selectedVariantDetails.pvid,
      taxPercentage: selectedVariantDetails.tax?.taxrate || 0,
      attributes: Object.entries(selectedAttributes).map(([attributeId, valueId]) => {
        const mappings = item.hasvarient ? selectedVariantDetails.pvamappings : item.variant.pvamappings;
        const attribute = mappings?.find((a: any) => a.attributeid == attributeId);
        const value = attribute?.pvamvaluemodels?.find((v: any) => v.avid == valueId);
        return {
          id: valueId,
          attributeId: attributeId,
          name: value?.attributeValueName || '',
          price: value?.price || 0
        };
      }).filter(attr => attr.name)
    };

    addToCart(cartItem);
    onClose();
  };

  if (!item) return null;

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {renderHeader()}
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.scrollContent}
          >
            {renderVariants()}
            {renderAttributes()}
          </ScrollView>
          <View style={styles.footer}>
            <View style={styles.quantityContainer}>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => handleQuantityChange(-1)}
              >
                <Text style={styles.quantityButtonText}>-</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity 
                style={styles.quantityButton} 
                onPress={() => handleQuantityChange(1)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleAddToCart}
            >
              <Text style={styles.addButtonText}>Add to Cart</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    maxHeight: '90%',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  required: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#f0f9f0',
  },
  optionLeft: {
    flex: 1,
  },
  optionName: {
    fontSize: 14,
  },
  optionRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    
  },
  price: {
    fontSize: 14,
    fontWeight: '500',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  radioButtonSelected: {
    // borderWidth:2,
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',

  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  quantityButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    fontSize: 20,
    color: '#4CAF50',
    fontWeight: '600',
  },
  quantityText: {
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'center',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 