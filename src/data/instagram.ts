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
    imageUrl: 'https://picsum.photos/seed/ig1/600/600',
    caption: 'Golden hour somewhere worth remembering.',
    altText: 'Placeholder photo 1',
  },
  {
    id: 'post_002',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: 'https://picsum.photos/seed/ig2/600/600',
    caption: 'Details that most people walk past.',
    altText: 'Placeholder photo 2',
  },
  {
    id: 'post_003',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: 'https://picsum.photos/seed/ig3/600/600',
    caption: 'Architecture that earns its footprint.',
    altText: 'Placeholder photo 3',
  },
  {
    id: 'post_004',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: 'https://picsum.photos/seed/ig4/600/600',
    caption: 'Still life at the edge of the frame.',
    altText: 'Placeholder photo 4',
  },
  {
    id: 'post_005',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: 'https://picsum.photos/seed/ig5/600/600',
    caption: 'Light doing most of the work.',
    altText: 'Placeholder photo 5',
  },
  {
    id: 'post_006',
    url: 'https://www.instagram.com/ericshell/',
    imageUrl: 'https://picsum.photos/seed/ig6/600/600',
    caption: 'The version the camera saw.',
    altText: 'Placeholder photo 6',
  },
]
