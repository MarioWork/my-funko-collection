export type ErrorKind = 'notFound' | 'adminOnly' | 'broken';

export type ErrorCopy = {
  // The storage-box label on the figure, as a tag reads "Box 3".
  label: string;
  title: string;
  description: string;
};
