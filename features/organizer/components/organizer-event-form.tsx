"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FieldError, Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { ApiError, apiFetch } from "@/lib/api-client";
import { CATEGORIES, CITIES } from "@/lib/constants";

const formSchema = z
  .object({
    title: z.string().trim().min(3, "Give your event a title.").max(140),
    summary: z.string().trim().max(200).optional(),
    description: z
      .string()
      .trim()
      .min(20, "Describe your event in at least 20 characters."),
    categoryId: z.string().optional(),
    bannerUrl: z
      .string()
      .trim()
      .url("Enter a valid image URL.")
      .optional()
      .or(z.literal("")),
    isOnline: z.boolean(),
    onlineUrl: z.string().trim().url("Enter a valid link.").optional().or(z.literal("")),
    venueName: z.string().trim().max(140).optional(),
    venueAddress: z.string().trim().max(240).optional(),
    city: z.string().trim().max(80).optional(),
    startAt: z.string().min(1, "Choose a start date and time."),
    endAt: z.string().min(1, "Choose an end date and time."),
    ticketTypes: z
      .array(
        z.object({
          name: z.string().trim().min(1, "Ticket name is required."),
          price: z
            .number({ message: "Enter a price." })
            .min(0, "Price cannot be negative."),
          quantity: z
            .number({ message: "Enter a quantity." })
            .int()
            .min(1, "At least 1 seat."),
        }),
      )
      .min(1, "Add at least one ticket type."),
  })
  .refine((value) => new Date(value.startAt) < new Date(value.endAt), {
    message: "The end time must be after the start.",
    path: ["endAt"],
  })
  .refine((value) => !value.isOnline || Boolean(value.onlineUrl), {
    message: "Online events need a join link.",
    path: ["onlineUrl"],
  });

type FormValues = z.infer<typeof formSchema>;

function defaultWindow() {
  const start = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  start.setMinutes(0, 0, 0);
  const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
  const toLocalInput = (date: Date) =>
    new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
      .toISOString()
      .slice(0, 16);
  return { startAt: toLocalInput(start), endAt: toLocalInput(end) };
}

export function OrganizerEventForm({
  categories,
}: {
  categories: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const window = defaultWindow();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      summary: "",
      description: "",
      categoryId: categories[0]?.id ?? CATEGORIES[0].slug,
      bannerUrl: "",
      isOnline: false,
      onlineUrl: "",
      venueName: "",
      venueAddress: "",
      city: "Bengaluru",
      startAt: window.startAt,
      endAt: window.endAt,
      ticketTypes: [{ name: "General Admission", price: 500, quantity: 100 }],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "ticketTypes" });
  const isOnline = useWatch({ control, name: "isOnline" });

  async function submit(values: FormValues, submitForReview: boolean) {
    setFormError(null);
    try {
      await apiFetch("/api/organizer/events", {
        method: "POST",
        body: {
          ...values,
          summary: values.summary || undefined,
          bannerUrl: values.bannerUrl || undefined,
          onlineUrl: values.onlineUrl || undefined,
          city: isOnline ? values.city || "Online" : values.city,
          startAt: new Date(values.startAt).toISOString(),
          endAt: new Date(values.endAt).toISOString(),
          submitForReview,
        },
      });
      toast.success(
        submitForReview
          ? "Event submitted for approval — an admin will review it."
          : "Draft saved.",
      );
      router.push("/organizer/events");
      router.refresh();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : "Could not save the event. Try again.",
      );
    }
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit((values) => submit(values, true))}>
      {formError ? <Alert variant="destructive">{formError}</Alert> : null}

      <Card>
        <CardHeader>
          <CardTitle>Event details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            <FieldError message={errors.title?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="summary">Short summary</Label>
            <Input
              id="summary"
              placeholder="One line shown on cards"
              {...register("summary")}
            />
            <FieldError message={errors.summary?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-invalid={Boolean(errors.description)}
              {...register("description")}
            />
            <FieldError message={errors.description?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <Select id="categoryId" {...register("categoryId")}>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bannerUrl">Banner image URL</Label>
              <Input id="bannerUrl" placeholder="https://…" {...register("bannerUrl")} />
              <FieldError message={errors.bannerUrl?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>When &amp; where</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startAt">Starts</Label>
              <Input
                id="startAt"
                type="datetime-local"
                aria-invalid={Boolean(errors.startAt)}
                {...register("startAt")}
              />
              <FieldError message={errors.startAt?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endAt">Ends</Label>
              <Input
                id="endAt"
                type="datetime-local"
                aria-invalid={Boolean(errors.endAt)}
                {...register("endAt")}
              />
              <FieldError message={errors.endAt?.message} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 rounded border-input accent-[var(--primary)]"
              {...register("isOnline")}
            />
            This is an online event
          </label>

          {isOnline ? (
            <div className="space-y-1.5">
              <Label htmlFor="onlineUrl">Join link</Label>
              <Input
                id="onlineUrl"
                placeholder="https://meet…"
                {...register("onlineUrl")}
              />
              <FieldError message={errors.onlineUrl?.message} />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="venueName">Venue name</Label>
                <Input id="venueName" {...register("venueName")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="venueAddress">Address</Label>
                <Input id="venueAddress" {...register("venueAddress")} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Select id="city" {...register("city")}>
                  {CITIES.filter((city) => city !== "Online").map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle>Ticket types</CardTitle>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", price: 0, quantity: 50 })}
          >
            <Plus />
            Add type
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {errors.ticketTypes?.root?.message ? (
            <FieldError message={errors.ticketTypes.root.message} />
          ) : null}

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_120px_120px_40px]"
            >
              <div className="space-y-1.5">
                <Label htmlFor={`ticket-name-${index}`}>Name</Label>
                <Input
                  id={`ticket-name-${index}`}
                  placeholder="Early Bird"
                  {...register(`ticketTypes.${index}.name`)}
                />
                <FieldError message={errors.ticketTypes?.[index]?.name?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`ticket-price-${index}`}>Price (₹)</Label>
                <Input
                  id={`ticket-price-${index}`}
                  type="number"
                  min={0}
                  step="1"
                  {...register(`ticketTypes.${index}.price`, { valueAsNumber: true })}
                />
                <FieldError message={errors.ticketTypes?.[index]?.price?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`ticket-qty-${index}`}>Quantity</Label>
                <Input
                  id={`ticket-qty-${index}`}
                  type="number"
                  min={1}
                  {...register(`ticketTypes.${index}.quantity`, { valueAsNumber: true })}
                />
                <FieldError message={errors.ticketTypes?.[index]?.quantity?.message} />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove ticket type"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                >
                  <Trash2 className="text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner /> : null}
          Submit for approval
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={handleSubmit((values) => submit(values, false))}
        >
          Save as draft
        </Button>
      </div>
    </form>
  );
}
