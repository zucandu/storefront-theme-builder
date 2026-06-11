import { defineStore } from 'pinia';
import mockPosts from '@/data/posts.json';

export const usePostStore = defineStore('post', {
    state: () => ({ posts: [], pagination: {} }),
    actions: {
        async fetchPosts(params) {
            this.posts = mockPosts.posts || [];
            this.pagination = mockPosts.pagination || {};
            return { paginator: { data: this.posts, ...this.pagination } };
        },
        async fetchPostBySlug(slug) {
            return mockPosts.posts[0] || null;
        },
    },
});
