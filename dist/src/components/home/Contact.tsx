import { useMutation } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { insertContactMessageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PhoneIcon, MailIcon, FacebookIcon, InstagramIcon, TwitterIcon, PinterestIcon } from "@/assets/icons";

const formSchema = insertContactMessageSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export default function Contact() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const mutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      return apiRequest("POST", "/api/contact", data);
    },
    onSuccess: async () => {
      toast({
        title: "Message Sent",
        description: "Thank you for your message! We'll get back to you soon.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "There was a problem sending your message. Please try again.",
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    mutation.mutate(data);
  }

  return (
    <section id="contact" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-12">Contact Us</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <div>
            <h3 className="text-xl font-display font-semibold mb-4">Salon Information</h3>
            
            <div className="mb-6">
              <h4 className="font-medium text-primary mb-2">Address</h4>
              <p>StrandStudio Salon</p>
              <p>123 Hair Street, Suite 101</p>
              <p>Styleton, NY 10001</p>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-primary mb-2">Contact</h4>
              <div className="flex items-center mb-1">
                <PhoneIcon />
                <span className="ml-2">(555) 123-4567</span>
              </div>
              <div className="flex items-center">
                <MailIcon />
                <span className="ml-2">appointments@strandstudio.com</span>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="font-medium text-primary mb-2">Hours</h4>
              <div className="grid grid-cols-2 gap-2">
                <div>Monday - Friday</div>
                <div>9:00 AM - 7:00 PM</div>
                <div>Saturday</div>
                <div>9:00 AM - 5:00 PM</div>
                <div>Sunday</div>
                <div>Closed</div>
              </div>
            </div>
            
            <div className="flex space-x-4">
              <a href="#" className="text-primary hover:text-secondary transition-colors">
                <FacebookIcon />
              </a>
              <a href="#" className="text-primary hover:text-secondary transition-colors">
                <InstagramIcon />
              </a>
              <a href="#" className="text-primary hover:text-secondary transition-colors">
                <TwitterIcon />
              </a>
              <a href="#" className="text-primary hover:text-secondary transition-colors">
                <PinterestIcon />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-display font-semibold mb-4">Send Us a Message</h3>
            
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
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="How can we help?" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Message</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your message here..." 
                          className="resize-none" 
                          rows={4}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button
                  type="submit"
                  className="bg-primary hover:bg-secondary text-white font-semibold py-3 px-6 rounded-md transition"
                  disabled={mutation.isPending}
                >
                  {mutation.isPending ? "Sending..." : "Send Message"}
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
}
