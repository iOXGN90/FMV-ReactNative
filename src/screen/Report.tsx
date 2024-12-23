import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, Image, TextInput, ScrollView, Modal, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { useRoute, useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_URL } from '../url';

const Report = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const delivery = route.params?.delivery;
  const [isNavigating, setIsNavigating] = useState(false);

  const [damageCounts, setDamageCounts] = useState({});
  const [comment, setComment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state

  const handleDamageChange = (product, newValue) => {
    const deliveredQuantity = product.quantity || 0;
    let numericValue = parseInt(newValue.replace(/^0+/, ''), 10);
    if (isNaN(numericValue)) numericValue = 0;

    // If user entered a value greater than delivered quantity, show alert and revert.
    if (numericValue > deliveredQuantity) {
      Alert.alert('Error', `You cannot report more damages than the delivered quantity (${deliveredQuantity}).`);
      numericValue = deliveredQuantity; // Cap the value
    }

    setDamageCounts((prevState) => ({
      ...prevState,
      [product.product_id]: numericValue.toString(),
    }));
  };

  const handleTakePhoto = async () => {
    try {
      if (isNavigating) return;
      setIsNavigating(true);

      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Camera access denied');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setPhotos((prevPhotos) => [...prevPhotos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error while taking photo:', error);
      Alert.alert('Error', 'Unable to take photo. Please try again.');
    } finally {
      setIsNavigating(false);
    }
  };

  const handlePickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Gallery access denied');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 1,
      });

      if (!result.canceled && result.assets?.length) {
        setPhotos((prevPhotos) => [...prevPhotos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Unable to pick image. Please try again.');
    }
  };

  const handleImagePress = (uri) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  const removePhoto = (indexToRemove) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, index) => index !== indexToRemove));
  };

  // CURRENT PROGRESS
  const handleSubmit = async () => {
    setLoading(true); // Show loading indicator
  
    const formData = new FormData();
    formData.append('notes', comment.trim() === '' ? 'no comment' : comment.trim());
  
    if (delivery && delivery.products && Array.isArray(delivery.products)) {
      delivery.products.forEach((product, index) => {
        const noOfDamages = damageCounts[product.product_id] || '0';
        formData.append(`damages[${index}][product_id]`, product.product_id);
        formData.append(`damages[${index}][no_of_damages]`, noOfDamages);
      });
    } else {
      console.error('Products array in delivery is undefined or not an array');
      Alert.alert('Error', 'There is a problem with the delivery data structure.');
      setLoading(false);
      return;
    }
  
    // Log the notes and damages added to formData
    console.log("Form data for notes and damages:", comment, damageCounts);
  
    // Before appending the image to FormData, log it separately
    if (photos.length > 0) {
      photos.forEach((photo, index) => {
        const fileName = photo.split('/').pop();
        const file = {
          uri: photo,
          name: fileName || `photo_${index}.jpg`,
          type: 'image/jpeg',
        };

        console.log(`Image ${index}:`, file); // Log image info

        // Append to FormData
        formData.append('images[]', file);
      });
    }

    // Manually log FormData parts to check the images added
    formData.forEach((value, key) => {
      if (key === 'images[]') {
        console.log(`${key}:`, value); // log the image object properly
      } else {
        console.log(`${key}: ${value}`); // log other form data
      }
    });
    
    try {
      const response = await axios.post(`${API_URL}/api/update-delivery/${delivery.delivery_id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'Delivery report submitted successfully!', [
        {
          text: 'OK',
          onPress: () => {
            setPhotos([]);
            setComment('');
            setDamageCounts({});
            setLoading(false); // Hide loading indicator
            navigation.navigate('My Deliveries');
          },
        },
      ]);
    } catch (error) {
      console.error('Error submitting delivery report:', error.response?.data || error.message);
      Alert.alert('Error', 'An error occurred while submitting the report.');
      setLoading(false); // Hide loading indicator on error
    }
  
    // Just to simulate the post request was successful for now
    Alert.alert('Success', 'Delivery report data ready for submission.', [
      {
        text: 'OK',
        onPress: () => {
          setLoading(false); // Hide loading indicator
          console.log('Form Data Ready for Submission:', formData);
        },
      },
    ]);
  };
  
  
  

  return (
    <SafeAreaView className="flex-1 bg-white p-5">
      <ScrollView>
        <View className="mb-5 w-full flex flex-row justify-center items-center bg-blue-500 rounded-2xl p-3">
          <Text className="text-2xl font-bold text-white">Delivery Report for ID: {delivery?.delivery_id}</Text>
        </View>
        {delivery ? (
          <>
            <View className="mb-5">
              <Text className="text-xl font-bold">Delivery ID: {delivery.delivery_id}</Text>
              <Text className="text-xl">Purchase Order ID: {delivery.purchase_order_id}</Text>
            </View>

            <Text className="text-lg font-bold mb-2">Damage Report:</Text>
            {delivery.products.map((product, index) => {
              const productName = product.product_name || product.name || 'Unnamed Product';
              const deliveredQuantity = product.quantity || 0;
              const currentDamageCount = damageCounts[product.product_id]?.toString() || '0';

              return (
                <View key={index} className="mb-4">
                  <Text className="text-xl font-bold text-blue-500">{productName}</Text>
                  <Text className="text-base mb-2 text-blue-700">Quantity Brought: {deliveredQuantity}</Text>
                  <Text>Damage:</Text>
                  <TextInput
                    className="border border-gray-300 rounded bg-red-100 text-red-500 text-xl px-2 py-2 mt-2"
                    placeholder="Number of damages"
                    keyboardType="numeric"
                    value={currentDamageCount}
                    onChangeText={(text) => handleDamageChange(product, text)}
                  />
                </View>
              );
            })}

            <View className="mb-5">
              <Text className="text-lg font-bold">Comments (Optional):</Text>
              <TextInput
                className="border border-gray-300 rounded px-2 py-2 mt-2 h-24 text-left"
                multiline
                numberOfLines={4}
                placeholder="Add any comments..."
                value={comment}
                onChangeText={setComment}
                textAlignVertical="top"
                textAlign="left"
              />
            </View>

            <View className="mb-5">
              <Text className="text-lg font-bold">Photos (Optional):</Text>
              {photos.length > 0 ? (
                <ScrollView horizontal className="mt-3">
                  {photos.map((photoUri, index) => (
                    <View key={index} className="mr-3">
                      <TouchableOpacity onPress={() => handleImagePress(photoUri)}>
                        <Image source={{ uri: photoUri }} className="w-[100px] h-[100px] rounded" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removePhoto(index)}
                        className="mt-2 bg-red-500 p-1 rounded"
                      >
                        <Text className="text-white text-center">Remove</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text className="text-sm text-gray-500">No photos taken yet.</Text>
              )}
            </View>

            {loading ? (
              <View className="mt-5">
                <ActivityIndicator size="large" color="#007BFF" />
              </View>
            ) : (
              <>
              <View className='flex flex-row p-1 w-full gap-2'>
                <TouchableOpacity 
                  onPress={handleTakePhoto} 
                  className="bg-green-500 p-3 rounded mb-5 w-1/2"
                >
                <Text className="text-white text-md text-center">Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={handlePickImage} 
                  className="bg-yellow-500 p-3 rounded mb-5 w-1/2"
                >
                  <Text className="text-white text-md text-center">Pick Photo from Gallery</Text>
                </TouchableOpacity>
              </View>
                
                <TouchableOpacity onPress={handleSubmit} className="bg-blue-500 p-3 rounded">
                  <Text className="text-white text-lg text-center">Submit Report</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        ) : (
          <Text>Loading delivery details...</Text>
        )}
      </ScrollView>

      <Modal visible={modalVisible} onRequestClose={() => setModalVisible(false)} transparent>
        <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
          <View className="bg-white p-5 rounded-lg">
            {selectedImage && <Image source={{ uri: selectedImage }} className="w-[300px] h-[500px]" />}
            <TouchableOpacity onPress={() => setModalVisible(false)} className="mt-5">
              <Text className="text-center text-red-500">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default Report;
