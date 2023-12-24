import { Image, StyleSheet, Text, TouchableOpacity, View,ActivityIndicator, Dimensions, TextInput, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { CommonActions, useNavigation, useRoute } from '@react-navigation/native';
 import { auth, db } from '../data/Firebase';
 import {collection , where, query, getDocs, getDoc, doc, orderBy, arrayUnion, addDoc, update, updateDoc,arrayRemove } from "firebase/firestore";
import userCollectionFech from '../components/userCollectionFech';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import Divider from '../components/Divider';
import { onAuthStateChanged } from 'firebase/auth';
import { useAuth } from '../auth/AuthContext';
    const PostDetails = () => {
  const route = useRoute();
  const { id } = route.params;
 
  const [postDetails, setPostDetails] = useState(null);
  const navigation = useNavigation()
  const { document, loading } = userCollectionFech('posts', id);  
  const { post } = route.params;
  const [comment, setComment] = useState()
  const [userInfoProfileFetch, setUserProfileFetch] = useState(null)
  const navigateToProfile = (userId) => {
    console.log('Navigating to Profile screen with user ID:', userId);
    navigation.dispatch(
      CommonActions.navigate({
        name: 'UserProfileScreen',
        params: { uid: userId },
      })
    );
  }; 
  const {user} = useAuth()
  // console.log(document)
   useEffect(() => {
    setPostDetails(document);
  }, [document]);


  useEffect(() => {
    onAuthStateChanged(auth, (user)=>{
      if (user){
        const uid =  user.uid;
         const fetchData = async () => {
          const timestamp = ('timestamp', 'desc')
            const citiesRef = collection(db, 'profileUpdate');
          const querySnapshot = query(citiesRef, 
            where("uid", "==", uid));             
          orderBy(timestamp);
          const snapshot = await getDocs(querySnapshot);
           const documents = snapshot.docs.map((doc) => {            
            setUserProfileFetch({
            displayName: doc.data().displayName,
            editedProfileImage: doc.data().editedProfileImage,
            lastName:doc.data().lastName,
           })              
             });
          };    
        fetchData();
      }
    })    
  },[])  
  const CommentsToFirebase = async (post, comment) => {
    const today = new Date();
    const date = today.toDateString();
    const Hours = today.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const time = today.toLocaleDateString();
    const postRef = doc(db, 'posts', postDetails.id);  
    try {
      await updateDoc(postRef, {
        comments: arrayUnion({
          date: date,
          Hours: Hours,
          time: time,
          displayName: userInfoProfileFetch.displayName,
          editedProfileImage: userInfoProfileFetch.editedProfileImage,
          lastName: userInfoProfileFetch.lastName,
          comment: comment,
        }),
      });  
      console.log('Comment added successfully!');
    } catch (error) {
      console.error('Error adding comment: ', error);
    }
  };
  const handleLike = async () => {
    const currentUserEmail = auth.currentUser?.email;      
    if (!currentUserEmail) {
      console.error('Current user email is undefined.');
      return;
    }        
    const currentLikeStatus = !postDetails?.likes_by_user || !postDetails?.likes_by_user.includes(currentUserEmail);
    const postRef = doc(db, 'posts', postDetails?.id);          
    try {
      await updateDoc(postRef, {
        likes_by_user: currentLikeStatus
          ? arrayUnion(currentUserEmail)
          : arrayRemove(currentUserEmail),
      });    
      // Fetch the updated post data after the like operation
      const updatedPostDoc = await getDoc(postRef);
      const updatedPostData = updatedPostDoc.data();  
      if (updatedPostData) {
        // Update the local state with the updated post data
        setPostDetails(updatedPostData);
      }        
      console.log('Post has been liked successfully by a user');
    } catch (error) {
      console.error('Error updating document', error);
    }
  };    
  const likesCount = postDetails?.likes_by_user ? postDetails?.likes_by_user.length : 0;
  const [imageDimensions, setImageDimensions] = React.useState({ width: 1, height: 1 });
  useEffect(() => {
    if (postDetails?.image) {
      Image.getSize(postDetails.image, (width, height) => {
        setImageDimensions({ width, height });
      }, (error) => {
        console.error('Error getting image size:', error);
      });
    }
  }, [postDetails?.image]);

 

  return (
    <View>
        <ScrollView>
        <View style={styles.topHeader}>
        <View style={styles.topHeaderIcons}>
          <TouchableOpacity
          onPress={()=>navigation.navigate('Feed')}
          >
            <Ionicons name="arrow-back-outline" color="white" size={24} style={styles.leftArrowIcon} />
          </TouchableOpacity>
          {/* <Text style={styles.uploadTopText}>Upload photo</Text>            */}
        </View>
      </View>

      {loading ? (
        <View>
        <View style={[styles.container, styles.horizontal]}>    
         <ActivityIndicator size="large" color="#000000" />
</View>
    </View> 
      ): (
          <>
          <View   style={styles.postContainer}>
         <TouchableOpacity onPress={() => navigateToProfile(postDetails.uid)} >
         <View style={styles.profileContainer}>
        <Image
        source={{uri : postDetails?.editedProfileImage}}
        style={styles.profileImage}
        />
        <View style={styles.profileDetails}>
        <Text style={styles.displayName}>{postDetails?.displayName} {postDetails?.lastName}</Text>
        <Text style={styles.timetemp}>{postDetails?.postTime}</Text>
        </View>
       </View>
         </TouchableOpacity>
      {/* Post */}       
       <View style={styles}>       
        <Text style={styles.caption}>{postDetails?.caption}</Text>
        <Image 
         source={{ uri: postDetails?.image }}
        style={{
          width: '100%',
          aspectRatio: imageDimensions.width / imageDimensions.height,  
        }}
        resizeMode="cover"
          alt='postimage11'/>                                
    {/* Interactions */}
        <View style={styles.Interactions}>
        <TouchableOpacity onPress={() => handleLike(post)} style={{flexDirection: 'row', alignItems: 'center'}}>
        <Ionicons name='heart-outline' size={24} color={'#000000'} />
        <Text>{likesCount.toLocaleString('en')} likes</Text>
      </TouchableOpacity>
         <TouchableOpacity>
         <Ionicons name="chatbubble-outline" size={24} color="#000000" />
         </TouchableOpacity>
        <TouchableOpacity>
        <Ionicons name='share-social-outline' size={24} color={'#000000'}/>
        </TouchableOpacity>
        </View>
        
         <View>
         <View style={styles.commentContent}>
          
         <TextInput
         style={styles.comment}
         placeholderTextColor={'#444'} 
         placeholder="Add comment"
        autoFocus={false}
         onChangeText={(text)=>setComment(text)}
         value={comment}
        />
       <TouchableOpacity onPress={() => CommentsToFirebase(post, comment)}>
  <Ionicons name='send' size={24} color={'#000000'} />
</TouchableOpacity>
         </View>
         <Divider/>
       </View>
       </View>
        </View>
        <View>
        <View style={{ margin:10 }}>
    {!!postDetails?.comments && Array.isArray(postDetails?.comments) && postDetails.comments.length > 0 && (
      <TouchableOpacity 
      // onPress={() => navigation.navigate('AllComments', { post })}
      >
        <Text>
          {postDetails?.comments.length}{' '}
          {postDetails?.comments.length > 1 ? 'comments' : 'comment'}
        </Text>
      </TouchableOpacity>
    )}
  </View>
    </View>



    <View
     style={styles.commenterMainContainer}
     >
       {/* onPress={() => navigateToProfile(post.uid)} */}
    {postDetails?.comments && Array.isArray(postDetails?.comments) && postDetails?.comments.length > 0 ? (
      postDetails?.comments.map((comment, index) => (
        <View key={index} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.commenterContainer}>
            <TouchableOpacity onPress={() => navigateToProfile(postDetails.uid)}>
            <Image source={{uri: comment?.editedProfileImage}} style={styles.CommentProfileImage}/>
            </TouchableOpacity>
             <TouchableOpacity style={styles.commentProfileInfo}>
             <View >
             <Text onPress={() => navigateToProfile(postDetails.uid)} style={{ fontWeight: '600' }}>{comment?.displayName} {comment?.lastName}</Text> 
             <Text>{comment.comment}</Text>
             </View>
             </TouchableOpacity>
           </View>
        </View>
      ))
    ) : (
      <Text>No comments</Text>
    )}
  </View>
          </>
      )}
         


        </ScrollView>

      </View>
  );
};


 
  
 


export default PostDetails;

const styles = StyleSheet.create({
    // postContainer:{
    //     margin: 10,
    // },
    profileImage: {
        width:50,
        height: 50,
        borderRadius: 50,
    },
    profileContainer:{
        flexDirection: 'row',
        margin:10
    },
    profileDetails:{
        marginLeft: 10
    },
    displayName: {
        fontWeight:'bold',
        color:'#000000'
    },
    caption: {
       marginTop: 10,
       marginBottom:10,
       marginLeft:10
    },
    Interactions: {
        flexDirection: "row",
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 10,
    },
    image:{
        width: '100%',
        height: 300,
        objectFit:'contain'
     },
     topHeader: {
        marginTop: Platform.OS === 'ios' ? -9 : 20,
        backgroundColor: '#FFA07A',
        height: 50
      },
    
     topHeaderIcons: {
        margin: 10,
        flexDirection: 'row',
        alignItems: 'center',
        },
       container: {
         justifyContent: 'center',
        alignItems: 'center',
      },
      uploadTopText: {
        color: '#ffffff',
        fontWeight: 'bold',
        marginLeft: 10
      },
      container2: {
        flex: 1,
        justifyContent: 'center',
      },
      horizontal: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 10,
      },
      comment: {         
        marginTop: 30,
        marginBottom: 10,
        width: '100%',
        marginLeft:20
       },
       commentContent: {          
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent:"space-between",
          width: Dimensions.get('window').width * .85,  
         },

       commenterContainer:{
        flexDirection: 'row',
        alignItems:"center",
        marginTop: 5,
        backgroundColor: 'tomato'
        },

       CommentProfileImage:{
        width:40,
        height: 40,
        borderRadius: 50,
       },
      commenterContainer:{
        marginLeft: 10,
        flexDirection: 'row'
      },
      commentProfileInfo: {
        marginLeft: 10,
         marginBottom: 20,
        backgroundColor: '#ECECEC',
        padding:10,
        borderRadius: 10
       },

       timetemp: {
        fontSize: 12
       }
    
});
