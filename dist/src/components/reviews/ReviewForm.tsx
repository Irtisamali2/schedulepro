import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { insertReviewSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StarIcon } from "@/assets/icons";

const formSchema = insertReviewSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  rating: z.number().min(1, "Please select a rating").max(5),
  text: z.string().min(10, "Review must be at least 10 characters"),
  publishConsent: z.boolean().refine(val => val === true, {
    message: "You must consent to publish your review",
  }),
});

export default function ReviewForm() {
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      rating: 0,
      text: "",
      publishConsent: false,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/reviews", data);
    },
    onSuccess: async () => {
      toast({
        title: "Review Submitted",
        description: "Thank you for your review! It will be published after moderation.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem submitting your review. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }

  const handleRatingHover = (rating: number) => {
    setHoveredRating(rating);
  };

  const handleRatingLeave = () => {
    setHoveredRating(0);
  };

  const handleRatingClick = (rating: number) => {
    form.setValue("rating", rating);
  };

  const currentRating = form.watch("rating");

  return (
    <Card className="max-w-2xl mx-auto bg-white p-8 rounded-lg shadow-md">
      <h3 className="text-2xl font-display font-semibold mb-6">Share Your Experience</h3>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input placeholder="your@email.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="rating"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Rating</FormLabel>
                <FormControl>
                  <div 
                    className="flex text-gray-400 text-2xl"
                    onMouseLeave={handleRatingLeave}
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        className={`mr-1 ${
                          (hoveredRating >= rating || (!hoveredRating && currentRating >= rating))
                            ? "text-yellow-400"
                            : ""
                        }`}
                        onMouseEnter={() => handleRatingHover(rating)}
                        onClick={() => handleRatingClick(rating)}
                      >
                        <StarIcon filled={hoveredRating >= rating || (!hoveredRating && currentRating >= rating)} />
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Your Review</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Tell us about your experience..." 
                    className="resize-none" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="publishConsent"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    I consent to having this review published on Google and the salon website
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />
          
          <Button
            type="submit"
            className="bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-md transition w-full md:w-auto"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </Form>
    </Card>
  );
}
