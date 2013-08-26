package WormBase::API::Service::lineage;

use Moose;

with 'WormBase::API::Role::Object'; 
#extends 'WormBase::API::Object';
#extends 'WormBase::API';

=info

Cell lineage file is tab-delimited with the following format:
< after header row >
    Parent Cell 
    Interaction Type    
    Daughter Cell   
    Cell Common Name    
    Daughter Cell (No common names) 
    Parent Cell Generation  
    Node_size   
    Emb Term    
    Apoptoses   
    Emb Term Blast

=cut

has 'pm_datadir' => (
    is  => 'ro',
    lazy => 1,
    default  => sub {
        my $self= shift;
        my $meta = $self->meta;
        for my $method ( sort map {$_->fully_qualified_name} $meta->get_all_methods ) {
            
            print $method, "\n" if $method =~ /index/;
        }
        use Data::Dumper;
        
        print Dumper($self->pre_compile),"\n";
        #print $self->pre_compile->{base},"\n";
        #print $self->ace_dsn->version,"\n";
        #return catdir($self->pre_compile->{base}, $self->ace_dsn->version,
        #              'position_matrix');
        return 'asdf';
    }
);


has 'cl_datadir' => (
    is => 'ro',
    lazy => 1,
    default => sub {
        my $self = shift;
        use Data::Dumper;
        print Dumper($self);
        return 'asdf';
        #return catdir($self->pre_compile->{base}, $self->ace_dsn->version,
        #              'position_matrix');
    }
);

has 'cl_filename' => (
    is => 'ro',
    lazy => 1, 
    default => 'Cell_lineage_Cytoscape.tab'
);

sub index{
	my $self = shift @_;
	my $lineage_file_path = "/home/jdmswong/jdmswong-dev/files/lineage/Cell_lineage_Cytoscape.tab";
    open ( my $infile, $lineage_file_path ) 
        or die "Couldn't open $lineage_file_path: $!";
	
	<$infile>; # dump header row
	while(<$infile>){
        my (
            $parent_cell,
            $int_type,
            $daughter_cell_id_common_name,
            $dcell_common_name,
            $dcell_id,
            $pcell_generation,
            $node_size,   
            $emb_term,    
            $apoptoses,   
            $emb_term_blast
        ) = split(/\t/);
        
        
	}
	
	return {
		#test => $self->cl_datadir,"::",$self->cl_filename
        test => 'asdf123'
	};
}


1;
