export interface InstagramPost {
  id: string
  url: string
  imageUrl: string
  caption: string
  altText: string
}

export const instagramPosts: InstagramPost[] = [
  {
    id: 'post_001',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: '/posts/AA2_8841.png',
    caption: 'Golden hour somewhere worth remembering.',
    altText: 'Photo by Eric Shell',
  },
  {
    id: 'post_002',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: '/posts/EJS01205.png',
    caption: 'Details that most people walk past.',
    altText: 'Photo by Eric Shell',
  },
  {
    id: 'post_003',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: '/posts/EJS01692.png',
    caption: 'Architecture that earns its footprint.',
    altText: 'Photo by Eric Shell',
  },
  {
    id: 'post_004',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: '/posts/EJS06506.jpg',
    caption: 'Still life at the edge of the frame.',
    altText: 'Photo by Eric Shell',
  },
  {
    id: 'post_005',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: '/posts/EJS08482.jpg',
    caption: 'Light doing most of the work.',
    altText: 'Photo by Eric Shell',
  },
  {
    id: 'post_006',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: '/posts/EJS08874.jpg',
    caption: 'The version the camera saw.',
    altText: 'Photo by Eric Shell',
  },
]
