import { useQuery } from "@tanstack/react-query";
import { type Review } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StarIcon } from "@/assets/icons";
import ReviewForm from "@/components/reviews/ReviewForm";

export default function Reviews() {
  const { data: reviews, isLoading, error } = useQuery<Review[]>({
    queryKey: ["/api/reviews"],
  });

  return (
    <section id="reviews" className="py-16 bg-neutral">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">Client Reviews</h2>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="bg-white shadow-md">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-28 mb-4" />
                  <Skeleton className="h-16 w-full mb-4" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : error ? (
          <div className="text-center text-red-500 mb-12">
            <p>Error loading reviews. Please try again later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {reviews?.filter(r => r.published).map((review) => (
              <ReviewCard key={review.id || `review-${review.name}-${review.date}`} review={review} />
            ))}
          </div>
        )}
        
        <ReviewForm />
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center mb-4">
        <div className="text-yellow-400 flex mr-2">
          {[...Array(5)].map((_, i) => (
            <StarIcon key={i} filled={i < review.rating} />
          ))}
        </div>
        <span className="text-gray-600">{review.rating}.0</span>
      </div>
      <p className="text-gray-700 mb-4">"{review.text}"</p>
      <div className="flex items-center justify-between">
        <div className="font-medium">{review.name}</div>
        <div className="text-sm text-gray-500">
          {new Date(review.date).toLocaleDateString("en-US", { 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </div>
      </div>
    </Card>
  );
}
