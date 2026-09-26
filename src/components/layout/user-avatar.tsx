type UserAvatarProps = {
  initials: string;
};

export function UserAvatar({ initials }: UserAvatarProps) {
  return (
    <div className="ml-1 grid size-8 place-items-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
      {initials}
    </div>
  );
}
