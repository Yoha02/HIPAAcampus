type BrandMarkProps = {
  name?: string;
};

export function BrandMark({ name = "HIPAcampus" }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <span className="grid size-7 place-items-center rounded-md bg-primary text-sm text-primary-foreground">
        {name.charAt(0)}
      </span>
      {name}
    </div>
  );
}
