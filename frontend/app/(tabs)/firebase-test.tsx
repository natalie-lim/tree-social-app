import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { firestoreService, postsService } from '../../services/firestore';

export default function FirebaseTestScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');

  // Load posts when component mounts
  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await postsService.getPosts(10);
      setPosts(fetchedPosts);
      console.log('Loaded posts:', fetchedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
      Alert.alert('Error', 'Failed to load posts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const createTestPost = async () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      Alert.alert('Error', 'Please fill in both title and content');
      return;
    }

    setLoading(true);
    try {
      const postData = {
        title: newPostTitle,
        content: newPostContent,
        authorId: 'test-user-123',
        authorName: 'Test User',
        likes: 0,
      };

      const postId = await postsService.createPost(postData);
      console.log('Created post with ID:', postId);
      
      // Clear form
      setNewPostTitle('');
      setNewPostContent('');
      
      // Reload posts
      await loadPosts();
      
      Alert.alert('Success', 'Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('Error', 'Failed to create post: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (postId) => {
    try {
      await postsService.deletePost(postId);
      await loadPosts();
      Alert.alert('Success', 'Post deleted successfully!');
    } catch (error) {
      console.error('Error deleting post:', error);
      Alert.alert('Error', 'Failed to delete post: ' + error.message);
    }
  };

  const likePost = async (postId) => {
    try {
      const post = posts.find(p => p.id === postId);
      if (post) {
        await firestoreService.update('posts', postId, {
          likes: (post.likes || 0) + 1
        });
        await loadPosts();
      }
    } catch (error) {
      console.error('Error liking post:', error);
      Alert.alert('Error', 'Failed to like post: ' + error.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Firebase Test</Text>
        <Text style={styles.subtitle}>Testing Firestore Integration</Text>
      </View>

      {/* Create Post Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Create New Post</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Post Title"
          value={newPostTitle}
          onChangeText={setNewPostTitle}
        />
        
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Post Content"
          value={newPostContent}
          onChangeText={setNewPostContent}
          multiline
          numberOfLines={3}
        />
        
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={createTestPost}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Creating...' : 'Create Post'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Load Posts Button */}
      <TouchableOpacity
        style={[styles.button, styles.loadButton]}
        onPress={loadPosts}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Loading...' : 'Refresh Posts'}
        </Text>
      </TouchableOpacity>

      {/* Posts List */}
      <View style={styles.postsContainer}>
        <Text style={styles.sectionTitle}>Posts ({posts.length})</Text>
        
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Create your first post above!</Text>
          </View>
        ) : (
          posts.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postHeader}>
                <Text style={styles.postAuthor}>{post.authorName}</Text>
                <Text style={styles.postDate}>
                  {post.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                </Text>
              </View>
              
              <Text style={styles.postTitle}>{post.title}</Text>
              <Text style={styles.postContent}>{post.content}</Text>
              
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={styles.likeButton}
                  onPress={() => likePost(post.id)}
                >
                  <Text style={styles.actionText}>❤️ {post.likes || 0}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deletePost(post.id)}
                >
                  <Text style={styles.actionText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 20,
    borderRadius: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadButton: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#34C759',
  },
  postsContainer: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthor: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  postDate: {
    fontSize: 12,
    color: '#666',
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  postContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    gap: 12,
  },
  likeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
  },
  deleteButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffebee',
    borderRadius: 20,
  },
  actionText: {
    fontSize: 14,
    color: '#333',
  },
});
